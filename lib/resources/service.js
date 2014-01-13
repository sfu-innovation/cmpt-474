
var express = require('express'),
	authenticated = require('../authenticated'),
	authorized = require('../authorized'),
	allow = require('../allow'),
	roles = require('../roles'),
	is = require('../is'),
	accepts = require('../accepts'),
	Service = require('../models/service'),
	resource = require('../resource')(Service);

var app = express();

app.all('/', allow('GET', 'POST'));

app.get(
	'/',
	accepts('application/json'),
	function(req, res) {
		res.send(200, { });
	}
);

app.post(
	'/',
	accepts('application/json'),
	is('application/json'),
	authenticated(),
	express.json(),
	resource.parse(['type', 'configuration']),
	resource.claim(),
	resource.validate(),
	resource.put()
);

app.all('/:id', allow('DELETE', 'GET', 'PUT'))

app.del(
	'/:id',
	authenticated()
);

app.get(
	'/:id',
	accepts('application/json'),
	authenticated()
);

app.put(
	'/:id',
	accepts('application/json'),
	is('application/json'),
	authenticated()
);

module.exports = app;

