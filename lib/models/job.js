
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
		submission: { type: Schema.Types.ObjectId, ref: 'RepositorySubmission', required: true }
	}));

	M.discriminator('EvaluationJob', Schema({
		source: { type: Schema.Types.ObjectId, ref: 'RunJob', required: true }
	}));
}
