var child_process = require('child_process'),
	fs = require('fs'),
	async = require('async'),
	tmp = require('tmp'),
	Schema = require('mongoose').Schema;

module.exports = function(app) {
	var mongoose = app.get('mongoose');
	
	// Repository used for someone evaluating assignments maybe
	var EvaluatorRepository = Schema({
		assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
		repository: { type: Schema.Types.ObjectId, ref: 'Repository', required: true },
		evaluator: { type: 'String', required: true }
	});

	// God help us all.
	EvaluatorRepository.pre('validate', function(callback) {
		var evaluator = this.evaluator, self = this;

		async.auto({

			// If a repository hasn't been setup yet, then set one up
			'repositoryObject': [ function(next) {
				if (self.repository) return next(repository);
				mongoose.model('Repository')({ owner: evaluator }).save(function(err, obj) {
					self.repository = obj;
					next(err, obj);
				});
			}],
			
			// Clone it
			'path': [ 'repositoryObject', function(next, data) {
				tmp.dir({  }, function(err, dir) {
					if (err) return next(err);
					data.repositoryObject.clone(dir, function(err) {
						next(err, dir);
					});
				})
			}],

			// Find all submission repositories for the assignment
			'repositories': [ function repositories(next) {
				console.log('finding repositories...');
				console.log(self.assignment);
				mongoose.model('SubmissionRepository')
					.find({ assignment: self.assignment })
					.populate('repository')
					.exec(next);
			}],

			// Write out some files into the new evaluator repo
			'submodules': [ 'path', 'repositories', function modules(next, data) {
				console.log(data.repositories);
				// Have to use series since git cannot run in parallel
				async.forEachSeries(data.repositories, function(repo, next) {
					var remote = 'http://innovate.cs.surrey.sfu.ca/code/'+repo.repository.id;
					child_process.execFile('git', [
						'ls-remote', remote
					], function(err, result) {
						if (err) return next(err);
						if (result.toString('utf8').split('\n').some(function(line) {
							var parts = line.split(/\s+/, 2);
							return parts[1] === 'HEAD';
						})) {
							child_process.execFile('git', [
								//'-c', 'http.sslCAInfo', './innovate.crt',
								//'-c', 'http.sslKey', './uploader.key',
								//'-c', 'http.sslCert', './uploader.crt',
								'submodule', 'add',
									'-f',
									'--reference', repo.repository.path,
									'--name', repo.target,
									remote,
									repo.target 
							], { cwd: data.path }, next);
						}
						else {
							next();
						}
					});
					
				}, next)
			}],

			'readmeFile': [ 'path', function readme(next, data) {
				fs.writeFile(data.path+'/README.md', 'Hello :)', next);
			}],

			// Add them to git
			'add': [ 'submodules', 'readmeFile', function add(next, data) {
				console.log('adding...');
				child_process.execFile('git', [
					'add', 
						'README.md' 
				], { cwd: data.path }, next);
			}],

			// Commit them
			'commit': [ 'path', 'add', function commit(next, data) {
				console.log('committing...');
				child_process.execFile('git', [
					'commit',
						'--all', 
						'--quiet',
						'--message', 'Initial commit.',
						'--author', 'SFU <no-reply@sfu.ca>' 
				], { cwd: data.path }, next);
			} ],

			// Send them upstream
			'push': [ 'path', 'commit', function push(next, data) {
				console.log('pushing...');
				child_process.execFile('git', [
					//'-c', 'http.sslCAInfo', './innovate.crt',
					//'-c', 'http.sslKey', './uploader.key',
					//'-c', 'http.sslCert', './uploader.crt',
					'push',
					data.repositoryObject.path,
					'master'
				], { cwd: data.path }, next)
			}]
		}, callback);
	})

	mongoose.model('EvaluatorRepository', EvaluatorRepository);

};
