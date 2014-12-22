var app = require('./lib/app'),
	async = require('async'),
	mongoose = app.get('mongoose');



mongoose.model('Job').discriminators['RunJob'].find({ submitter: 'cas:illidany' }).exec(function(err, runs) {
	async.forEach(runs, function(run, next) {
		console.log('Evaluating '+run.id+'...');
		mongoose.model('Job').discriminators['EvaluationJob']({
			source: run
		}).enqueue(next);
	}, function(err) {
		console.log(err);
	});
});
				

