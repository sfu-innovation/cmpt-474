

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
		var doc = mongoose.model('Submission')({
			submitter: request.principal,
			owner: bindings.target,
			at: Date.now(),
			assignment: bindings.assignment,
			type: 'git',
			data: { repository: bindings.repository, commit: data.to }
		});


		// FIXME: this is stupid, on doc creation mixed fields should be
		// marked as modified if they are not null. Not to mention for
		// some reason this call isn't chainable? WTF.
		//doc.markModified('data'); 
		doc.save(function(err, submission) {
			if (err) return next(err);
			console.log('Submission made:',colors.red.bold(submission._id),'on behalf of',colors.blue.bold(bindings.target));
			next();
		});
	});
}

