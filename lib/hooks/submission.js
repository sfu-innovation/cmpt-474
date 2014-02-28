

var colors = require('cli-color');

module.exports = function hook(app, hook, request, data, next) {

	var mongoose = app.get('mongoose');

	// Get submission information about this repository.
	mongoose.model('SubmissionRepository').findById(hook.id, function(err, bindings) {
		
		// Basic error checks
		if (err) return next(err);
		if (!bindings) return next({ error: 'NON_SUBMITTABLE_REPOSITORY' });
		

		// Make a new submission on behalf of whomever comitted to
		// this particular repository and save it.
		var doc = mongoose.model('Submission').discriminators['RepositorySubmission']({
			submitter: request.principal,
			owner: bindings.target,
			at: Date.now(),
			assignment: bindings.assignment,
			repository: bindings.repository, 
			commit: data.to
		});

		doc.save(function(err, submission) {
			if (err) return next(err);
			console.log('Submission made:',colors.red.bold(submission._id),'on behalf of',colors.blue.bold(bindings.target));
			next();
		});
	});
}

