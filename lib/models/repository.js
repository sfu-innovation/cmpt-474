
var Stream = require('stream'),
	Schema = require('mongoose').Schema,
	mkdirp = require('mkdirp'),
	child_process = require('child_process'),
	DuplexPassThrough = require('duplex-passthrough'),
	fs = require('fs'),
	rimraf = require('rimraf'),
	git = require('nodegit'),
	extend = require('xtend'),
	util = require('util');


module.exports = function(app) {

	var mongoose = app.get('mongoose');

	var HookTemplate = Schema({
		// The kind of hook (post-receive, etc)
		type: { type: String, required: true, enum: [ 'post-receive' ] },
		// The name of the hook
		name: { type: String, required: true, unique: true },
		// Whether or not the hook is enabled
		enabled: { type: Boolean, default: true, required: true },
		// Path to the code of the hook (maybe this can be made more flexible? I dunno lol)
		script: { type: String, required: true },
		// Dependencies that need to be run before this hook
		needs: [ { type: String }],
		// The arguments to pass to the script
		data: { }
	});

	HookTemplate.path('script').validate(function(script, done) {
		// FIXME: Since done expects the first argument to be simply true/false
		// we can do this. No error handling here. lol.
		if (!script) return done();
		fs.exists(script, done);
	});


	var Hook = Schema({
		type: { type: String, required: true, enum: [ 'post-receive' ] },
		repository: { type: Schema.Types.ObjectId, ref: 'Repository', required: true },
		template: { type: Schema.Types.ObjectId, ref: 'RepositoryHookTemplate', required: true },
		enabled: { type: Boolean },
		data: { }
	});

	// Create indices for most common lookup case
	Hook.index({ type: 1, repository: 1 });


	Hook.pre('save', function(done) {
		var hook = this;
		hook.populate('repository', function(err, hook) {
			if (err) return done(err);
			
			// Links to create
			var source = __dirname+'/../git/hook.js', 
				destination = hook.repository.path+'/hooks'+'/'+hook.type;
			
			// Erh ma gerd look at this spaghetti can we get a cleanup
			// in ailse right here please.
			fs.exists(destination, function(exists) {
				if (exists) {
					fs.lstat(destination, function(err, stat) {
						if (err) return done(err);
						if (!stat.isSymbolicLink()) return done({ error: 'HOOK_ALREADY_EXISTS' });
						fs.readlink(destination, function(err, result) {
							if (err) return done(err);
							fs.realpath(result, function(err, result) {
								if (err) return done({ error: 'HOOK_INVALID_SYMLINK' });
								fs.realpath(source, function(err, path) {
									if (err) return done(err);
									if (path !== result) return done({ error: 'HOOK_INVALID_SYMLINK' });
									done();
								})
							});
						});
					});
				}
				else {
					fs.realpath(source, function(err, path) {
						if (err) return done(err);
						fs.symlink(path, destination, done);
					});
				}
			});
		});
	});

	var Repository = Schema({
		// Who the repository belongs to 
		owner: { type: String },
		public: { type: Boolean, default: false }
	});

	Repository.virtual('url').get(function() {
		return '/code/'+this._id
	});

	Repository.virtual('path').get(function() {
		return this.schema.get('repository path')+'/'+this.id;
	});

	Repository.method('getBranch', function(name, done) {
		git.Repo.open(this.path, function(err, repo) {
			if (err) return done(err);
			repo.getBranch(name, function(err, branch) {
				if (err) return done(err);
				done(undefined, {
					id: branch.sha(),
					name: name,
					getCommit: function(done) {
						repo.getCommit(this.id, function(err, commit) {
							if (err) return done(err);
							done(undefined, {
								id: commit.sha(),
								author: commit.author().toString(),
								message: commit.message()
							});
						});
					}
				})
			});
		});
	});

	Repository.method('ensure', function(next) {
		var path = this.path;
		fs.exists(path+'/HEAD', function(exists) {
			return exists ? next() : child_process.execFile('git', ['init', '--bare', '--quiet', path], next);
		});
	});

	Repository.method('clone', function(path, next) {
		child_process.execFile('git', ['clone', this.path, path], next);
	});

	// When the repository is removed, remove all its associated hooks
	Repository.pre('remove', function(next) {
		this.model('RepositoryHook').remove({ repository: this }, next);
	});

	// FIXME: Livin' in the DANGER ZONE.
	Repository.post('remove', function() {
		rimraf(this.path);
	});

	Repository.post('save', function() {
		var repo = this;
		repo.ensure(function(err) {
			if (err) return;
			fs.writeFile(repo.path+'/info.json', JSON.stringify(repo.toJSON()));	
		});
	});

	Repository.method('rpc', function(method, opts) {
		var repo = this, juggler = new DuplexPassThrough(), exited = true, child = null, closed = false;
		repo.ensure(function(err) {
			if (err) return juggler.emit('error', err);
			if (closed) return;
			var args = [method], buf = '', env = extend(process.env, { });
			if (opts.stateless) args.push('--stateless-rpc');
			if (opts.advertise) args.push('--advertise-refs');
			args.push(repo.path);

			// If you have data that needs to be passed to the hook JSON encode it
			// and then set it to the environment variable GIT_DATA (if encoding)
			// fails emit an error.
			if (opts.data) {
				var str;
				try { str = JSON.stringify(opts.data); } catch(e) { return juggler.emit('error', e); }
				env['REQUEST_DATA'] = str;
				env['REPO_ID'] = repo._id;
			}

			child = child_process.spawn('git', args, {
				env: env
			});

			exited = false;
			child.on('exit', function(code) {
				exited = true;
				if (code !== 0) juggler._reader.emit('error', buf || code || 'unknown git error');
			});

			// lol the power of satan. never do this. ever.
			juggler._writer.pipe(child.stdin);
			child.stdout.pipe(juggler._reader);
			juggler._reader.read(0);
			juggler._writer.read(0);
			child.stdin.read(0);

			child.stderr.on('readable', function() {
				var chunk;
				while(chunk = this.read())
					buf += chunk.toString('utf8');
			});
		});

		juggler.close = function() {
			closed = true;

			if (exited) return;
			// Try and shutdown nicely first and if we can't
			// do that in a couple of seconds just destroy
			child.kill('SIGINT');
			setTimeout(function() {
				if (!exited)
					child.kill('SIGKILL');
			}, 2000);
		}

		return juggler;
	});

	Repository.method('head', function(done) {
		var repo = this;
		repo.ensure(function(err) {
			if (err) return done(err);
			fs.readFile(repo.path+'/HEAD', done);
		});
	});

	mongoose.model('Repository', Repository);
	mongoose.model('RepositoryHook', Hook);
	mongoose.model('RepositoryHookTemplate', HookTemplate);
}
