var 
	Model = require('../model'),
	validate = require('../validate');

module.exports = Model.create('instance', [
	{ name: 'location', validate: validate.number() },
	{ name: 'services', validate: validate.number() }
]);
