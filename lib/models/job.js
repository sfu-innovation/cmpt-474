
var Schema = require('mongoose').Schema,
	cutie = require('cutie');

module.exports = function(app) {
	
	var mongoose = app.get('mongoose'),
		queue = cutie.redis.queue(),
		events = cutie.redis.events();

	var Job = cutie.mongoose.schema(Schema)
		// Provide job.enqueue via redis
		.plugin(cutie.mongoose.queueable, queue)
		// Provide emit/on hooks via redis
		.plugin(cutie.mongoose.eventable, events);

	
	Job.add({
		// Who submitted the job (in future ref this to user or something)
		submitter: { type: String, index: true  }
	});
	
	var M = mongoose.model('Job', Job);

	// FIXME: Move this stuff to the proper files
	M.discriminator('RunJob', Schema({
		// Submission that's being run
		submission: { type: Schema.Types.ObjectId, ref: 'RepositorySubmission', required: true },
		// The random component that's associated with the run; runs that have the same
		// randomm component should produce the same results (assuming the user code is also 
		// not random).
		nonce: { type: String, default: function() { return Math.random().toString(36).substr(2).toUpperCase(); } }
	}));

	M.discriminator('EvaluationJob', Schema({
		source: { type: Schema.Types.ObjectId, ref: 'RunJob', required: true }
	}));
}
