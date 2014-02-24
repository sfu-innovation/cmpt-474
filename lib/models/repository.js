
var Stream = require('stream'),
	Schema = require('mongoose').Schema,
	mkdirp = require('mkdirp'),
	child_process = require('child_process'),
	fs = require('fs'),
	git = require('nodegit'),
	util = require('util');

var schema = Schema({
	// Who the repository belongs to 
	owner: { type: String },
});

schema.virtual('url').get(function() {
	return '/code/'+this._id
});

schema.virtual('path').get(function() {
	return this.schema.get('repository path')+'/'+this.id;
})

schema.method('getBranch', function(name, done) {
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

schema.method('ensure', function(next) {
	var path = this.path;
	fs.exists(path+'/HEAD', function(exists) {
		return exists ? next() : child_process.execFile('git', ['init', '--bare', '--quiet', path], next);
	});
});

schema.post('save', function() {
	repo.ensure(function(err) {
		if (err) return;
		fs.writeFile(this.path+'/info.json', JSON.stringify(this.toJSON()));	
	});
});

var DuplexPassThrough = require('duplex-passthrough');

schema.method('rpc', function(method, opts) {
	var repo = this, juggler = new DuplexPassThrough();
	repo.ensure(function(err) {
		if (err) return juggler.emit('error', err);
		var args = [method], buf = '';
		if (opts.stateless) args.push('--stateless-rpc');
		if (opts.advertise) args.push('--advertise-refs');
		args.push(repo.path);
		var child = child_process.spawn('git', args);
		child.on('exit', function(code) {
			if (code !== 0) juggler.emit('error', buf || code || 'unknown git error');
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
	return juggler;
});

schema.method('head', function(done) {
	var repo = this;
	repo.ensure(function(err) {
		if (err) return done(err);
		fs.readFile(repo.path+'/HEAD', done);
	});
});


module.exports = {
	'Repository': schema
}
