
var express = require('express'),
	authenticated = require('../authenticated'),
	authorized = require('../authorized'),
	allow = require('../allow'),
	roles = require('../roles'),
	is = require('../is'),
	accepts = require('../accepts'),
	Instance = require('../models/instance'),
	resource = require('../resource')(Instance);

var app = express();

app.all('/', allow('GET', 'POST'))

app.post(
	'/',
	accepts('application/json'),
	is('application/json'),
	authenticated(),
	express.json(),
	resource.parse(['services']),
	resource.claim(),
	resource.validate(),
	resource.put()
);


app.all('/:id', allow('GET'))

app.get(
	'/:id',
	accepts('application/json'),
	resource.load(),
	resource.get()
);

module.exports = app;