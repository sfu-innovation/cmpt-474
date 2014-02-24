
var Schema = require('mongoose').Schema;

module.exports = {
	// An individual evaluation
	'Evaluation': Schema({
		// Which submission the evaluation is evaluating
		submission: { type: Schema.Types.ObjectId, ref: 'Submission' },
		// When the evaluation was given
		at: { type: Date, default: Date.now },
		// How the evaluation was given
		mode: { type: String, enum: [ 'automatic', 'manual', 'children' ] },
		// Result of the evaluation
		result: { type: Number }
	}),

	// Settings for controlling an assignment's evaluation method
	'EvaluationSettings': Schema({
		// Which assignment the settings apply to
		assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', unique: true, required: true },
		// How to evaluate the assignment
		mode: { type: String, enum: [ 'none', 'automatic', 'manual', 'children' ], required: true },
		// Settings related to the mode
		data: { }
	})
}
