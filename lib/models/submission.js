
var async = require('async'),
	Schema = require('mongoose').Schema;

module.exports = function(app) { 

	var mongoose = app.get('mongoose');

	var Submission = Schema({
		// Who submitted the submission
		submitter: { type: String, required: true },
		// Who the submission belongs to 
		owner: { type: String, required: true },
		// When the submission was sent in
		at: { type: Date, default: Date.now, required: true },
		// Which assignment the submission is relevant to
		assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true }
	});


	var SubmissionSettings = Schema({
		// Which assignment the settings are relevant to
		assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', unique: true },
		// The earliest date submissions can be made (default to assignment start)
		start: { type: Date },
		// The latest submissions can be made (default to assignment end)
		end: { type: Date },
		// How assignments are to be submitted
		mode: { type: String, enum: [ 'git', 'disabled' ], default: 'git' }
	});

	// Mark which repositories are being used to evaluate which users for which assignment
	var SubmissionRepository = Schema({
		// The repository for which submissions are enabled
		repository: { type: Schema.Types.ObjectId, ref: 'Repository', required: true, unique: true },
		// The assignment submissions will be generated for
		assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
		// On whose behalf the submissions will be made
		target: { type: 'String', required: true },
		// The hook that triggers the submission in the repository
		hooked: { type: Schema.Types.ObjectId, ref: 'RepositoryHook', required: true }
	});

	SubmissionRepository.method('setup', function(done) {
		
		var self = this,
			Template = mongoose.model('RepositoryHookTemplate'),
			Hook = mongoose.model('RepositoryHook');
		
		if (!this.repository) return next({ error: 'NO_REPOSITORY' });

		async.auto({
			'template': [function(next) {
				Template.findOne({ name: 'submission' }, function(err, template) {
					if (err) return next(err);
					if (!template) return Template({
							type: 'post-receive',
							name: 'submission',
							script: __dirname+'/../hooks/submission.js',
							enabled: true
						}).save(function(err, template) { return next(err, template); });
					return next(undefined, template)
				});
			}],
			'hook': ['template', function(next, data) {
				Hook({
					type: 'post-receive',
					repository: self.repository,
					template: data.template
				}).save(function(err, hook) { return next(err, hook); });
			}],
			'install': ['hook', function(next, data) {
				self.hooked = data.hook;
				next();
			}]
		}, done);
	});


	SubmissionRepository.pre('validate', function(next) {
		if (this.hooked) return next();
		this.setup(next);
	});

	var X = mongoose.model('Submission', Submission);
	mongoose.model('SubmissionSettings', SubmissionSettings);
	mongoose.model('SubmissionRepository', SubmissionRepository);

	var Y = X.discriminator('RepositorySubmission', Schema({
		repository: { type: Schema.Types.ObjectId, ref: 'Repository', required: true },
		commit: { type: String, required: true }
	}));

}
