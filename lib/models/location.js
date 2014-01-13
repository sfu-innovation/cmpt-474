
var 
	Model = require('../model'),
	validate = require('../validate');

module.exports = Model.create('location', [ {
	name: 'id',
	validate: validate.matches(/[^\/]+/),
	index: true,
	unique: true
}, { 
	name: 'latitude', validate: validate.number() 
}, { 
	name: 'longitude', 
	validate: validate.number() 
}]);
