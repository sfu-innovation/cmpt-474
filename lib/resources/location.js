
var express = require('express'),
	authenticated = require('../authenticated'),
	authorized = require('../authorized'),
	roles = require('../roles'),
	Location = require('../models/location'),
	resource = require('../resource')(Location);


var app = express();

app.put(
	'/:id',
	authenticated(),
	express.json(),
	roles.authorize('admin'),
	authorized(),
	resource.parse(),
	resource.validate(),
	resource.put()
);

app.get(
	'/:id',
	authenticated(),
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

module.exports = app;
