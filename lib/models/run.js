var 
	Model = require('../model'),
	validate = require('../validate'),
	Benchmark = require('./benchmark');

module.exports = Model.create('run', [{ 
	//Who submitted the request
	name: 'submitter',
	validate: validate.uuid()
}, {
	//Time the benchmark run request was submitted 
	name: 'submitted', 
	validate: validate.date() 
}, {
	//Time the benchmark started being executed 
	name: 'started', 
	validate: validate.date() 
}, {
	//Time the benchmark finished being executed 
	name: 'ended', 
	validate: validate.date() 
}, {
	//Status of the run 
	name: 'status', 
	validate: validate.enumeration([
		'unknown', 
		'pending', 
		'running', 
		'aborted', 
		'complete', 
		'error'
	]),
	default: 'unknown'
}, {
	//Which benchmark is being run 
	name: 'benchmark' 
}, { 
	//Against which topology
	name: 'topology' 
}, {
	//Results from the run 
	name: 'results' 
}]);
