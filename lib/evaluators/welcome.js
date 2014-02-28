
module.exports = function create(settings) {
	return function evaluate(job, done) {
		
		var success = job.source.logs.some(function(entry) { 
			return entry.type === 'stream' && entry.source === 1 && /hello world/i.test(entry.data.toString('utf8'));
		});

		var points = 0;

		if (success) {
			points = 1.0;
			job.log({ rationale: 'HELLO_FOUND', points: points });
		}
		else {
			points = 0.2;
			job.log({ rationale: 'HELLO_NOT_FOUND', points: points });
		}

		done(undefined, points);
	}
}
