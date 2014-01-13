var 
	Model = require('../model'),
	validate = require('../validate');

module.exports = Model.create('company', [
	{ name: 'members', validate: validate.every(validate.anything()) }
]);
