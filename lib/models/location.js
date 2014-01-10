
var 
	Model = require('../model'),
	validate = require('../validate');

module.exports = Model.create('location', [
	{ name: 'latitude', validate: validate.number() },
	{ name: 'longitude', validate: validate.number() }
]);
