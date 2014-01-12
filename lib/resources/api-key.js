
var express = require('express'),
	authenticated = require('../authenticated'),
	authorized = require('../authorized'),
	allow = require('../allow'),
	roles = require('../roles'),
	ApiKey = require('../models/api-key'),
	resource = require('../resource')(ApiKey),
	is = require('../is'),
	accepts = require('../accepts');

//Create the app
var app = express();


//Set the allowed methods
app.all('/', allow('POST'));

app.post(
	'/',
	is('application/json'),
	accepts('application/json'),
	express.json(),
	resource.parse(['email']),
	resource.validate(),
	resource.put()
);

//Set the allowed methods
app.all('/:id', allow('GET', 'DELETE', 'PUT'));

app.get(
	'/:id',
	accepts('application/json'),
	authenticated(),
	//roles.authorize('admin'),
	//authorized(),
	resource.load(),
	resource.get()
);

app.del(
	'/:id',
	authenticated(),
	roles.authorize('admin'),
	authorized(),
	resource.del()
);

app.put(
	'/:id',
	authenticated(),
	is('application/json'),
	accepts('application/json'),
	roles.authorize('admin'),
	authorized(),
	express.json(),
	resource.parse(),
	resource.validate(),
	resource.put()
);

module.exports = app;

