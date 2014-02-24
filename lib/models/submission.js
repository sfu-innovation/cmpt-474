
var Schema = require('mongoose').Schema;

module.exports = {
	'Submission': Schema({
		// Who submitted the submission
		submitter: { type: String },
		// Who the submission belongs to 
		owner: { type: String },
		// When the submission was sent in
		at: { type: Date, default: Date.now },
		// Which assignment the submission is relevant to
		assignment: { type: Schema.Types.ObjectId, ref: 'Assignment' }
	}),
	'SubmissionSettings': Schema({
		// Which assignment the settings are relevant to
		assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', unique: true },
		// The earliest date submissions can be made (default to assignment start)
		start: { type: Date },
		// The latest submissions can be made (default to assignment end)
		end: { type: Date },
		// How assignments are to be submitted
		mode: { type: String, enum: [ 'git', 'disabled' ], default: 'git' }
	}),

	// Mark which repositories are being used to evaluate which users for which assignment
	'SubmissionRepository': Schema({
		repository: { type: Schema.Types.ObjectId, ref: 'Repository', required: true },
		assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
		target: { type: 'String', required: true }
	})
}
