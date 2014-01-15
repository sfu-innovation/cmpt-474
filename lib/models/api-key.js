var 
	UUID = require('com.izaakschroeder.uuid'),
	SecureToken = require('com.izaakschroeder.secure-token'),
	Model = require('../model'),
	validate = require('../validate');

module.exports = Model.create('api-key', [{
	name: 'id',
	validate: validate.uuid(),
	default: UUID.generate,
	index: true,
	unique: true
},{
	name: 'principal',
	validate: validate.uuid(),
	default: UUID.generate
},{
	name: 'token',
	validate: validate.length(56),
	default: SecureToken(),
	index: true,
	unique: true
}, { 
	name: 'email', 
	validate: validate.matches(/.*@.*/),
	index: true
}, { 
	name: 'verified', 
	validate: validate.boolean(), 
	default: false 
}, { 
	name: 'active', 
	validate: validate.boolean(), 
	default: true 
}]);
