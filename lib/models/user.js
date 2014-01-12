
var 
	Model = require('../model'),
	validate = require('../validate');

module.exports = Model.create('user', [
	
	{ name: 'email', validate: validate.anything() }
]);
