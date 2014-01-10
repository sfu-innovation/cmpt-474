var 
	Model = require('../model'),
	validate = require('../validate');

module.exports = Model.create('topology', [
	{ name: 'instances', validate: validate.number() },
	
]);
