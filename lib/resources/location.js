
var express = require('express'),
	resources = require('../resource'),
	authorization = require('../authorization'),
	validate = require('../validate'),
	Location = require('../models/location');


module.exports = function(config) {

	var app = express(),
		api = config.api,
		roles = config.roles,
		resource = resources({
			store: config.store,
			model: Location
		});

	app.put(
		'/:id',
		api.authenticate(),
		express.json(),
		roles.authorize('admin'),
		authorization.verify(),
		resource.parse(),
		resource.validate(),
		resource.put()
	);

	app.get(
		'/:id',
		api.authenticate(),
		resource.load(),
		resource.get()
	);

	app.delete(
		'/:id',
		api.authenticate(),
		roles.authorize('admin'),
		authorization.verify(),
		resource.delete()
	);

	return app;
}