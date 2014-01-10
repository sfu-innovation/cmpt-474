
var express = require('express'),
	app = express(),
	resource = require('../resource'),
	authorize = require('../authorize'),
	validate = require('../validate');


module.exports = function(config) {

	var api = config.api;

	//----------------------------------------------
	//------- COMPANIES
	//----------------------------------------------
	app.put(
		'/:id', 
		express.json(),
		validate(all([
			property('icon', number()),
			property('open', boolean()),
			property('invitations', xxx)
		])),
		resource.put(redis, '/company', ['icon', 'open', 'invitations'])
	);

	app.put(
		'/:id/members/:user',
		authorize.on(function(req, res, next) {
			//if company is open, allow
			//if company is closed, check to see if member is in list of invitations
		}),
		authorize(),

	);

	app.put(
		'/:company/service/:service',
		api(),
		express.json(),
		authorize()
	);

	app.put(
		'/:company/instance/:instance', 
		validate(all([
			property('location', exists(redis, '/location')),
			property('services', set(exists(redis, '/service')))
		])),
		resource.put(redis, '/instance', ['location', 'services'])
	);

	return app;
};