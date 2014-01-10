var 
	Model = require('../model'),
	validate = require('../validate');

module.exports = Model.create('benchmark', [
	{ name: 'location', validate: validate.number() },
	
]);
