
var fs = require('fs'),
	path = require('path'),
	Schema = require('mongoose').Schema,
	evaluators = { };

// Load all the evaluators
var base = __dirname+'/../evaluators';
fs.readdirSync(base).forEach(function(name) {
	if (!/\.js$/.test(name)) return;
	evaluators[path.basename(name, '.js')] = require(base+'/'+name);
});

module.exports = function(mongoose) {

	// An individual evaluation
	var Evaluation = Schema({
		// Which submission the evaluation is evaluating
		submission: { type: Schema.Types.ObjectId, ref: 'Submission' },
		// When the evaluation was given
		at: { type: Date, default: Date.now },
		// How the evaluation was given
		mode: { type: String, enum: [ 'automatic', 'manual', 'children' ] },
		// Result of the evaluation
		result: { type: Number },
		// Who gave the evaluation
		source: { type: String },
		// Who the evaluation applies to
		target: { type: String },
		// Extra information about the evaluation
		data: { type: Schema.Types.Mixed }
	});

	// Settings for controlling an assignment's evaluation method
	var EvaluationSettings = Schema({
		// Which assignment the settings apply to
		assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', unique: true, required: true },
		// How to evaluate the assignment
		mode: { type: String, enum: [ 'none', 'automatic', 'manual', 'children' ], required: true },
		// Settings related to the mode
		data: { }
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

	var EvaluationRun = Schema({
		// The submission for which the evaluation is to be generated
		submission: { type: Schema.Types.ObjectId, ref: 'Submission', required: true },
		// Target (markee) for which the evaluation is to be generated
		target: { type: 'String', required: true  },
		// Job which the evaluator needs to examine
		job: { type: 'String', required: true },
		// Evaluator to use after the run is complete { kind: 'xxx', settings: { ... } }
		// NOTE: evaluator.type can't be used since type is special to mongoose
		evaluator: { type: { kind: { type: 'String' }, settings: { } }, required: true }
	});

	EvaluationRun.path('evaluator').validate(function(value, done) {
		// Check to see if the evaluator exists
		if (typeof evaluators[value.kind] === 'undefined') return done(false); //{ error: 'INVALID_EVALUATOR' }
		// Check to see if the evaluator can be used with the specified settings
		try { evaluators[value.kind](value.settings) } catch (e) { return done(false); }
		// Everything is good
		return done(true);
	});

	// Perform an evaluation of the run
	EvaluationRun.method('evaluate', function(done) {
		var run = this, evaluator = evaluators[this.evaluator.kind](this.evaluator.settings);
		run.populate('job', function(err, job) {
			if (err) return done(err);
			job.log(function(err, entries) {
				if (err) return done(err);
				evaluator(entries, function(err, result, data) {
					if (err) return done(err);
					mongoose.model('Evaluation')({
						submission: run.submission,
						at: Date.now(),
						mode: 'automatic',
						result: result,
						source: 'magic-evaluator',
						target: run.target,
						data: data
					}).save(done);
				});
			});
		});
	});

	mongoose.model('Evaluation', Evaluation);
	mongoose.model('EvaluationSettings', EvaluationSettings);
	mongoose.model('EvaluationRepository', EvaluationRepository);
	mongoose.model('EvaluationRun', EvaluationRun);

}
