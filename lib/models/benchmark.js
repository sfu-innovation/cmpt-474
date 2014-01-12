var 
	Model = require('../model'),
	validate = require('../validate');

module.exports = Model.create('benchmark', [{ 
	name: 'name', 
	validate: validate.matches(/[a-zA-Z0-9]{1,52}/) 
}, { 
	name: 'seed', 
	validate: validate.number() 
}, { 
	name: 'events', 
	validate: validate.every(validate.anything()) 
}, { 
	name: 'permissions', 
	validate: validate.every(validate.anything()) 
}]);
