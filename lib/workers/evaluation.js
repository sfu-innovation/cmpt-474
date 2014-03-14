#!/usr/bin/env node

var child_process = require('child_process'),
	fs = require('fs'),
	async = require('async'),
	byline = require('byline'),
	app = require('../app'),
	db = app.get('mongoose'),
	Job = db.model('Job').discriminators['EvaluationJob'],
	Evaluation = db.model('Evaluation').discriminators['AutomaticEvaluation'],
	EvaluationSettings = db.model('EvaluationSettings'),
	root = app.get('path')+'/var/evaluations';


//AutomaticEvaluation

// FIXME: Find a better/proper way of doing this.
// This is retarded, how come none of job.populate('source.submission'),
// job.populate('source submission') or job.populate('source', 'submission')
// actually do anything?

Job.process(1, function(job, done) {

	var path = root + '/' + job.id;

	async.auto({
		
		'source': [ function(next, data) {
			 job.populate('source', function(err) {
			 	if (!job.source) return next({ error: 'NO_SOURCE' });
			 	if (job.source.state !== 'complete') return next({ error: 'INCOMPLETE_RUN' });
			 	return next(undefined, job.source);
			 });
		}],

		'submission': [ 'source', function(next, data) {
			job.source.populate('submission', function(err) {
				if (err) return next(err);
				if (!job.source.submission) return next({ error: 'NO_SUBMISSION' });
				return next(undefined, job.source.submission);
			});
		}],

		'settings': [ 'submission', function(next, data) {
			EvaluationSettings.findOne({ assignment: data.submission.assignment }).populate('repository').exec(function(err, settings) {
				if (err) return next(err);
				if (!settings) return next({ error: 'NO_EVALUATION_SETTINGS' });
				if (!settings.repository) return next({ error: 'NO_REPOSITORY' });
				return next(undefined, settings);
			});
		}],


		'evaluator': [ 'settings', function(next, data) {
			job.log({ type: 'info', message: 'Setting up evaluator...' })
			data.settings.repository.clone(path, function(err) {
				if (err) return next(err);
				var exe = path+'/test/grade.py';
				fs.chmod(exe, '755', function(err) {
					if (err) return next(err);
					next(undefined, exe);	
				});
			});
		}],

		'process': [ 'evaluator', 'settings', function(next, data) {
			job.log({ type: 'info', message: 'Starting evaluation...' });
			
			var done = false,
				result = null,
				child = child_process.spawn(data.evaluator, [ '--format', 'json' ], { env: { } }), stderr = '';
			
			// Assume stderr data is error info if child exits with pid not 0
			child.stderr.on('readable', function() {
				var chunk;
				while (chunk = this.read())
					stderr += chunk.toString('utf8');
			});

			child.on('error', function(err) {
				if (done) return;
				done = true;
				next(err || true);
			})

			child.on('exit', function(code) {
				if (done) return;
				done = true;
				if (code !== 0) return next({ error: 'EVALUATOR_ERROR', data: stderr });
				next(undefined, result);
			});

			// Read all the results from the evaluator
			byline(child.stdout).on('readable', function() {
				var line;
				while (line = this.read()) {
					var obj;
					try { obj = JSON.parse(line.toString('utf8')) } catch (E) { obj = { type: 'unknown', data: line } }
					job.log(obj);
					result = obj.grade;
				}
			});

			// Pipe all the log entries to the evaluator
			job.source.logs.forEach(function(entry) {
				if (entry.type !== 'result') return;
				child.stdin.write(JSON.stringify(entry.data)+'\n');	
			});
			child.stdin.end();
			
			
		}],

		'evaluation': [ 'process', function(next, data) {
			Evaluation({
				nonce: data.source.nonce,
				submission: data.submission,
				assignment: data.submission.assignment,
				result: data.process,
				source: 'automatic-evaluator',
				target: data.submission.owner,
				run: data.source
			}).save(next);
		}]
	}, done);

});