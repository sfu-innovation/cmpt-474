
var express = require('express'),
	authenticated = require('../authenticated'),
	authorized = require('../authorized'),
	allow = require('../allow'),
	roles = require('../roles'),
	ApiKey = require('../models/api-key'),
	resource = require('../resource')(ApiKey);

//Create the app
var app = express();

//Set the allowed methods
app.all('/', allow('POST'));
app.all('/:id', allow('GET', 'DELETE'));

app.get(
	'/:id',
	authenticated(),
	roles.authorize('admin'),
	authorized(),
	resource.load(),
	resource.get()
);

app.delete(
	'/:id',
	authenticated(),
	roles.authorize('admin'),
	authorized(),
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


module.exports = app;

