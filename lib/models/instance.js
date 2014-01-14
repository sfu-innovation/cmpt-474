var 
	Model = require('../model'),
	validate = require('../validate'),
	UUID = require('com.izaakschroeder.uuid'),
	Service = require('./service');

module.exports = Model.create('instance', [{
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
	name: 'status',
	validate: validate.enumeration([
		'unknown',
		'stopped',
		'stopping',
		'started',
		'starting'
	]),
	default: 'unknown'
}, { 
	name: 'services', 
	validate: validate.serial([
		validate.notEmpty(),
		validate.every(validate.any([
			validate.refersTo(Service),
			validate.isA(Service, ['type', 'configuration'])
		]))
	])
}]);