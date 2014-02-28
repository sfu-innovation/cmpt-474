
var Schema = require('mongoose').Schema;

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
		repository: { type: Schema.Types.ObjectId, ref: 'Repository', required: true },
		assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
		target: { type: 'String', required: true }
	});

	SubmissionRepository.pre('save', function(next) {
		var target = this.target, id = this._id;

		this.populate('repository', function(err, doc) {
			if (err) return next(err);
			doc.repository.gitHook('post-receive', 'submit', __dirname+'/../hooks/submission.js', { id: id }, next);
		});
	});

	var X = mongoose.model('Submission', Submission);
	mongoose.model('SubmissionSettings', SubmissionSettings);
	mongoose.model('SubmissionRepository', SubmissionRepository);

	var Y = X.discriminator('RepositorySubmission', Schema({
		repository: { type: Schema.Types.ObjectId, ref: 'Repository', required: true },
		commit: { type: String, required: true }
	}));

}
