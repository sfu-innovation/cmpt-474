
var crypto = require('crypto'),
	express = require('express'),
	app = express(),
	R = require('../resource'),
	authorization = require('../authorization'),
	allowed = require('../allowed'),
	ApiKey = require('../models/api-key');

module.exports = function(config) {

	var api = config.api,
		roles = config.roles,
		redis = config.store,
		activator = config.activator,
		resource = R({
			store: config.store,
			model: ApiKey
		});

	
	//Set the allowed methods
	app.all('/', allowed('POST'));
	app.all('/:id', allowed('GET', 'DELETE'));

	app.get(
		'/:id',
		api.authenticate(),
		roles.authorize('admin'),
		authorization.verify(),
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

	app.post(
		'/',
		express.json(),
		resource.parse(['email']),
		resource.validate(),
		function(req, res, next) {
			activator.send(req.object.email, req.object.id, next);
		},
		resource.put()
	);

	app.post(
		'/verify',
		api.authenticate(false),
		function(req, res, next) {
			if (!req.apiKey) return res.send(400, { error: 'API_KEY_REQUIRED' });
			activator.send(req.apiKey.email, req.apiKey.id, next)
		},
		function(req, res) {
			res.send(200,{})
		}
	);

	app.get(
		'/verify/:nonce',
		activator.verify(),
		function(req, res) {

		}
	);

	return app;
}
