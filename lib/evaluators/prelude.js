
module.exports = function create(settings) {
	return function evaluate(job, done) {
		console.log('evaluatin!');
		job.log({ rationale: 'VALID_OUTPUT' });
		done(undefined, 0.9);
	}
}