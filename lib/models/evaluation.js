
var Schema = require('mongoose').Schema,
	evaluators = require('../evaluators');


module.exports = function(app) {
	
	var mongoose = app.get('mongoose');
	
	// An individual evaluation
	var Evaluation = Schema({
		// Which assignment the evaluation belongs to. Although this can
		// be drawn from submission, this use useful for search.
		assignment: { type: Schema.Types.ObjectId, ref: 'Assignment' },
		// Which submission the evaluation is evaluating
		submission: { type: Schema.Types.ObjectId, ref: 'Submission' },
		// When the evaluation was given
		at: { type: Date, default: Date.now },
		// Result of the evaluation
		result: { type: Number },
		// Who gave the evaluation
		source: { type: String },
		// Who the evaluation applies to
		target: { type: String }
	});

	// Settings for controlling an assignment's evaluation method
	var EvaluationSettings = Schema({
		// Which assignment the settings apply to
		assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', unique: true, required: true },
		// How to evaluate the assignment
		mode: { type: String, enum: [ 'none', 'automatic', 'manual', 'children' ], required: true },
		// FIXME: Shove this out into a discriminator
		evaluator: { type: { kind: { type: String, required: true }, settings: Schema.Types.Mixed } }
	});


	var EvaluationRepository = Schema({
		repository: { type: Schema.Types.ObjectId, ref: 'Repository', required: true }
	});

	EvaluationRepository.pre('save', function(next) {
		var id = this._id;
		this.populate('repository', function(err, repository) {
			if (err) return next(err);
			repository.hook('post-receive.evaluate', { id: id }, next);
		});
	});

	EvaluationRepository.pre('remove', function(next) {
		this.populate('repository', function(err, repository) {
			if (err) return next(err);
			repository.unhook('post-receive.evaluate', next);
		});
	});


	EvaluationSettings.path('evaluator').validate(function(value, done) {
		// Check to see if the evaluator exists
		if (typeof evaluators[value.kind] === 'undefined') return done(false); //{ error: 'INVALID_EVALUATOR' }
		// Check to see if the evaluator can be used with the specified settings
		try { evaluators[value.kind](value.settings) } catch (e) { return done(false); }
		// Everything is good
		return done(true);
	});

	// Better way than this? lol
	EvaluationSettings.method('createEvaluator', function() {
		return evaluators[this.evaluator.kind](this.evaluator.settings);
	});



	var X = mongoose.model('Evaluation', Evaluation);
	mongoose.model('EvaluationSettings', EvaluationSettings);
	mongoose.model('EvaluationRepository', EvaluationRepository);

	X.discriminator('AutomaticEvaluation', Schema({
		run: { type: Schema.Types.ObjectId, ref: 'RunJob', required: true },
		evaluator: { type: Schema.Types.Mixed, required: true }
	}));

}
