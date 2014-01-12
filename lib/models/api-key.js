var 
	SecureToken = require('com.izaakschroeder.secure-token'),
	Model = require('../model'),
	validate = require('../validate');

module.exports = Model.create('api-key', [{
	name: 'value',
	validate: validate.length(56),
	default: SecureToken() 
}, { 
	name: 'email', 
	validate: validate.matches(/.*@.*/) 
}, { 
	name: 'verified', 
	validate: validate.boolean(), 
	default: false 
}, { 
	name: 'active', 
	validate: validate.boolean(), 
	default: false 
}]);
