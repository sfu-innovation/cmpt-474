var 
	Model = require('../model'),
	validate = require('../validate'),
	User = require('./user');

module.exports = Model.create('company', [
	{ name: 'members', validate: validate.every(validate.anything()) }
]);
