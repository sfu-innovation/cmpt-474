#!/usr/bin/env node



var colors = require('cli-colors'),
	app = require(__dirname+'../../server'),
	fs = require('fs'),
	queue = app.get('queue');


function evaluate(job, next) {
	// Get all the job entries for the log
	job.log(function(err, entries) {

		// Run the evaluation code against them
		Evaluation({

		}).save(next);
	});
}

function run(job, next) {
	// Create a new run including:
	// owner: the person who's repository this is so we know who to assign marks to
	// type: the type of job that needs to be run
	// ??
	var log = job.log()

	// Create some blurb telling the user they're still waiting
	// for their job to be processed so they know what's going on.
	var ticker = setInterval(function() {
		job.position(function(err, position, total) {
			stdout.write('Still waiting for job '+job.id+' to start (position '+position+'/'+total+')...\n');
		});
	}, 3000);

	var timeout = setTimeout(function() {
		job.cancel();
		done();
	});

	function done(err) {
		job.removeListener('update', listener);
		log.close();
		return next(err, job);
	}

	job.on('update', function listener() {
		// Job is doing something now so stop bothering the user
		// about it.
		job.get('state', function(err, state) {
			if (state !== 'pending')
				clearInterval(ticker);
			switch(job.state) {
			case 'pending':
			case 'cancel':
			case 'active':
				break;
			case 'error':
				done(job.result || { error: 'UNKNOWN_JOB_ERROR' });
				break;
			case 'complete':
				done(undefined);
				break;
			}	
		});
	});

	log.pipe(stdout);

	return job;
}

module.exports = function hook(app, hook, request, data, next) {

	var stdout = process.stdout, stderr = process.stderr;

	EvaluationRepository.findById(data.id, function(err, settings) {
		if (err) return next(err);
		if (!settings) return next({ error: 'NON_EVALUATABLE_REPOSITORY' });
	
		async.auto({
			'job': [ function (next) {
				queue.job(settings.type, { repository: settings.repository, commit: args.to }, next);
			}],
			'evaluationRun': [ 'job', function (next) {
				EvaluationRun({
					submission: 
					job: job.id
				}).save(next);
			}],
			'run': [ 'evaluationRun', 'job', function (next) {
				run(job)
			}],
			'evaluate': [ 'run', 'evaluationRun', function (next) {
				evaluationRun.evaluate()
			}]
		});
	});

	

	// If the user aborts the request, then cancel the job.
	process.signal('SIGINT', function() {
		job.cancel();
	});

	
}
