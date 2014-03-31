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
			'repositoryObject': [ function(callback) {
				if (self.repository) return callback(repository);
				mongoose.model('Repository')({ owner: evaluator }).save(function(err, obj) {
					self.repository = obj;
					callback(err, obj);
				});
			}],
			
			// Clone it
			'repository': [ 'repositoryObject', function(callback, data) {
				tmp.dir({  }, function(err, dir) {
					if (err) return callback(err);
					data.repositoryObject.clone(dir, function(err) {
						callback(err, dir);
					});
				})
			}],

			// Find all submission repositories for the assignment
			'repositories': [ function repositories(callback) {
				mongoose.model('SubmissionRepository')
					.find({ assignment: self.assignment })
					.populate('repository')
					.exec(callback);
			}],
			
			// Add them as submodules for git
			'modulesData': [ 'repositories', function(callback, data) {
				callback(undefined, data.repositories.reduce(function(prev, repo) {
					return prev + 
						'[submodule "'+target+'"]\n'+
						'	path = '+target+'\n'+
						'	url = '+'http://innovate.cs.surrey.sfu.ca/code/'+repo.id+'\n\n';
				}, ''));
			}],

			// Write out some files into the new evaluator repo
			'modulesFile': [ 'repository', 'modules', function modules(callback, data) {
				fs.writeFile(data.path+'/.gitmodules', data.modules, callback);
			}],

			'readmeFile': [ 'repository', function readme(callback, data) {
				fs.writeFile(data.path+'/README.md', 'Hello :)', callback);
			}],

			// Add them to git
			'add': [ 'modulesFile', 'readmeFile', function add(next, data) {
				child_process.execFile('git', [
					'add', 
						'.gitmodules',
						'README.md' 
				], { cwd: data.path }, next);
			}],

			// Commit them
			'commit': [ 'add', function commit(next, data) {
				child_process.execFile('git', [
					'commit',
						'--all', 
						'--quiet',
						'--message', 'Initial commit.',
						'--author', 'SFU <no-reply@sfu.ca>' 
				], { cwd: data.path }, next);
			} ],

			// Send them upstream
			'push': [ 'commit', function push(next, data) {
				child_process.execFile('git', [
					'push',
					data.repositoryObject.path
				], { cwd: data.path }, next)
			}]
		}, callback);
	})

	mongoose.model('EvaluatorRepository', EvaluatorRepository);

};
