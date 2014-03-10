#!/usr/bin/env node

var async = require('async'),
	child_process = require('child_process'),
	Docker = require('dockerode'),
	app = require('../app'),
	db = app.get('mongoose'),
	Run = db.model('Job').discriminators['RunJob'],
	Evaluation = db.model('Job').discriminators['EvaluationJob'],
	Submission = db.model('Submission').discriminators['RepositorySubmission'],
	root = app.get('path')+'/var/runs';

//sudo docker build -t evaluation ./share/docker/.

// Now this is fucking stupid. Why is there an http:// in front
// of the host? Turns out dockerode code is full of shit here.
var docker = new Docker({host: 'http://localhost', port: 4243})

Run.process(1, function(job, done) {

	console.log('Starting run',job.id);

	var submission = job.submission;

	job.populate('submission', function(err, job) {
		if (err) return done(err);
		job.submission.populate('repository', function(err, submission) {
			
			if (err) return done(err);
			if (!submission) return done({ error: 'NO_SUBMISSION' });

			var path = root+'/'+job.id, repoPath = path +'/repo';

			async.auto({
				
				// Setup the source code directory.
				'source': [ function(next, data) {
					submission.repository.clone(repoPath, function(err) {
						if (err) return next(err);
						child_process.execFile('git', ['checkout', submission.commit ], { cwd: repoPath }, function(err) {
							if (err) return next(err);
							return next(undefined, repoPath);
						});
					})
				}],
				
				// Create the container with the appropriate settings.
				'container': [ function container(next, data) {
					docker.createContainer({
						//"Env": { "SUBMISSION": submission.id, "RUN": job.id },
						"Memory": 20*1024*1024,
						"AttachStdin": false,
						"AttachStdout": true,
						"AttachStderr": true,
						"Volumes": { "/source": { } },
						// Can't use process.getuid() thanks docker since this actually chuid inside the container
						// and has nothing to do with remapping ids
						//"User": process.env['USER'], 
						"Image": "evaluation",
						"ExposedPorts": { "80/tcp": { } },
						"Tty": false,
						"WorkingDir": "/source"
					}, next);
				}],
				
				// Import stderr, stdout and friends so we can get information from the run.
				'stream': [ 'container', function(next, data) {
					data.container.attach({stream: true, stdout: true, stderr: true}, next)
				}],
				
				// We are a go. Start the container and log all the streams it
				// produces for the user.
				'start': [ 'source', 'container', 'stream', function(next, data) {
					var header = null;
					data.stream.on('readable', function() {
						header = header || this.read(8);
						while(header !== null) {
							var type = header.readUInt8(0);
							var payload = this.read(header.readUInt32BE(4));
							if (payload === null) break;
							job.log({ 
								type: 'stream', 
								container: data.container.id, 
								source: type, 
								data: payload 
							});
							header = this.read(8);
						}
					});
					data.container.start({
						"Binds": [ data.source+":/source" ]
					}, next);
				}],
				
				// Wait until the container has finished its work and return the
				// result. If it takes too long, kill it and error out.
				'status': [ 'container', 'start', 'stream', function(next, data) {
					
					// Give one minute to run commands
					var done = false, killer = setTimeout(function() {
						console.log('timeout hit!');
						done = true;
						data.container.kill(function(err) {
							if (done) return;
							done = true;
							next(err || { error: 'CONTAINER_TIMEOUT' })
						});
						killer = null;
					}, 1000*60);
					
					// Wait for the container to do its business
					data.container.wait(function(err, status) {
						console.log('container quit',status);
						if (killer) clearTimeout(killer);
						if (done) return;
						done = true;
						next(err, status);
					});
				}],
				
				// We are almost done; we have reached the point where the
				// process didn't time out and has finished its work.  So
				// let's automatically queue it up for evaluation.
				'evaluation': [ 'container', 'status', function(next, data) {
					Evaluation({ source: job }).enqueue(next);
				}]
			}, function(err, data) {
				console.log('Completed run',job.id);
				if (err) return done(err);
				done();
			});

		});
	});
	
});