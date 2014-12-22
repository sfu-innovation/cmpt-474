#!/usr/bin/env node

var async = require('async'),
	colors = require('cli-color');


function work(job, next) {
	var 
		opts = { interval: 3000, wait: 10*60*1000 },
		lastMessageAt = 0, 
		beat = setInterval(tick, opts.interval),
		finalized = false,
		started = false;


	function startListener() {
		console.log('Job '+job.id+' started.');
		started = true;
	}

	function logListener(log) {
		switch(log.type) {
		case 'info':
			console.log(colors.xterm(39)('⚪ ')+log.message);
			break;
		case 'stream':
			var data = Buffer(log.data);
			// nodejs doesn't expose numbered streams so we have to write them ourselves
			if (log.source == 2) process.stderr.write(data);
			else process.stdout.write(data);
			break;
		case 'result':
			break;
		default:
			console.log(log);
			break;
		}
		
	}

	function endListener(reason, results) {
		console.log('Job '+job.id+' finished.');
		switch(reason) {
		case 'complete':
			return done(undefined, results);
		case 'error':
			return done({error: 'JOB_ERROR' });
		case 'cancelled':
			return done({error: 'JOB_CANCELLED'});
		default:
			return done({error: 'JOB_UNKNOWN_STATE'});
		}
	}

	function interruptListener() {
		job.cancel();
		setTimeout(function() { 
			if (finalized) return;
			return done({ error: 'JOB_UNCANCELLABLE' });
		}, 2000);
	}

	function tick() {
		job.position(function(err, position, total) {
			if (!started)
				console.log('Still waiting for job '+colors.red.bold(job.id)+' to start (position '+(position+1)+'/'+total+')...');
			
		});
	}


	function done(err, results) {
		if (finalized) return;
		finalized = true; 
		process.removeListener('SIGINT', interruptListener);
		clearInterval(beat);
		job.removeListener('start', startListener);
		job.removeListener('log', logListener);
		job.removeListener('end', endListener);
		next(err, job);
	}

	process.on('SIGINT', interruptListener);

	job.on('start', startListener)
		.on('log', logListener)
		.on('end', endListener);


	setTimeout(done, opts.wait);

	job.enqueue(function(err, job) {
		if (err) done(err);
		console.log('Job '+job.id+' submitted.');
	});
}



module.exports = function hook(app, repo, hook, request, data, priors, next) {

	if (!priors.submission) return next({ error: 'NO_SUBMISSION' });
	//if (!hook.data) return next({ error: 'NON_EVALUATABLE_REPOSITORY' });

	var mongoose = app.get('mongoose');
	
	async.map(priors.submission, function(submission, next) {
		async.auto({
			'run': [function run(next, data) {
				console.log(colors.cyan('Starting run...'));
				work(mongoose.model('Job').discriminators['RunJob']({ 
					submission: submission, 
					submitter: request.principal 
				}), next);
			}],
			'evaluation': ['run', function(next, data) {
				console.log(colors.cyan('Starting evaluation...'));
				work(mongoose.model('Job').discriminators['EvaluationJob']({
					source: data.run
				}), next);
			}]
		}, function(err, data) {
			//FIXME: Pass the final evaluation through to the next phase
			next(err);
		});
	}, next);
	
}
