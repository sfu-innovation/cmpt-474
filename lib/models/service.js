var 
	Model = require('../model'),
	validate = require('../validate'),
	UUID = require('com.izaakschroeder.uuid');


module.exports = Model.create('service', [{
	name: 'id',
	validate: validate.uuid(),
	default: UUID.generate,
	index: true,
	unique: true
}, {
	name: 'owner',
	validate: validate.uuid()
}, {
	name: 'createdOn',
	validate: validate.number(),
	default: Date.now
}, { 
	name: 'type', 
	validate: validate.enumeration(['redis','python','nodejs']),
}, { 
	name: 'configuration', 
	validate: validate.anything() ,
	default: { }
}]);
