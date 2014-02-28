#!/usr/bin/env node

var async = require('async'),
	app = require('../app'),
	db = app.get('mongoose'),
	Job = db.model('Job').discriminators['EvaluationJob'],
	Evaluation = db.model('Evaluation').discriminators['AutomaticEvaluation'],
	EvaluationSettings = db.model('EvaluationSettings');


//AutomaticEvaluation

Job.process(1, function(job, done) {

	// FIXME: Find a better/proper way of doing this.
	// This is retarded, how come none of job.populate('source.submission'),
	// job.populate('source submission') or job.populate('source', 'submission')
	// actually do anything?
	async.series([
		function(next) { job.populate('source', next) },
		function(next) { job.source.populate('submission', next) }
	], function(err) {
		
		if (err) return done(err);

		// TODO: Think about the logic here.
		// Only completed runs should get marked
		if (job.source.state !== 'complete') return done({ error: 'INCOMPLETE_RUN' });

		EvaluationSettings.findOne({ assignment: job.source.submission.assignment }, function(err, settings) {
			if (err) return done(err);
			if (!settings) return done({ error: 'NO_EVALUATION_SETTINGS' });
			console.log(settings.evaluator);
			settings.createEvaluator()(job, function(err, result) {
				if (err) return done(err);
				Evaluation({
					submission: job.source.submission,
					assignment: job.source.submission.assignment,
					result: result,
					source: 'automatic-evaluator',
					target: job.source.submission.owner,
					evaluator: settings.evaluator,
					run: job.source
				}).save(done);
			});
		});
	})

});