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
			
			// Add them as submodules for git
			'modules': [ 'repositories', function(callback, data) {
				callback(undefined, data.repositories.reduce(function(prev, repo) {
					return prev + 
						'[submodule "'+target+'"]\n'+
						'	path = '+target+'\n'+
						'	url = '+'http://innovate.cs.surrey.sfu.ca/code/'+repo.id+'\n\n';
				}, ''));
			}],

			// Write out some files into the new evaluator repo
			'modulesFile': [ 'path', 'modules', function modules(next, data) {
				fs.writeFile(data.path+'/.gitmodules', data.modules, next);
			}],

			'readmeFile': [ 'path', function readme(next, data) {
				fs.writeFile(data.path+'/README.md', 'Hello :)', next);
			}],

			// Add them to git
			'add': [ 'modulesFile', 'readmeFile', function add(next, data) {
				console.log('adding...');
				child_process.execFile('git', [
					'add', 
						'.gitmodules',
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
					'push',
					data.repositoryObject.path,
					'master'
				], { cwd: data.path }, next)
			}]
		}, callback);
	})

	mongoose.model('EvaluatorRepository', EvaluatorRepository);

};