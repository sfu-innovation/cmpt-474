var 
	Model = require('../model'),
	validate = require('../validate');

module.exports = Model.create('service', [
	{ name: 'type', validate: validate.enumeration('redis','python','nodejs') },
	{ name: 'configuration', validate: validate.anything() }
]);
