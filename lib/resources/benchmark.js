
var express = require('express'),
	authenticated = require('../authenticated'),
	authorized = require('../authorized'),
	allow = require('../allow'),
	roles = require('../roles'),
	ApiKey = require('../models/api-key'),
	resource = require('../resource')(ApiKey),
	is = require('../is'),
	accepts = require('../accepts');

var app = express();

app.all('/', allow('POST', 'GET'));

app.post(
	'/',
	authenticated(),
	accepts('application/json'),
	is('application/json'),
	express.json(),
	resource.parse(),
	resource.validate(),
	resource.put()
);


app.get(
	'/',
	authenticated(),
	accepts('application/json'),
	resource.list()
);


app.all('/:id', allow('GET', 'DELETE'));

app.get(
	'/:id',
	accepts('application/json'),
	resource.load(),
	resource.show()
);

app.del(
	'/:id',
	accepts('application/json'),
	authenticated(),
	roles.authorize('admin'),
	authorized(),
	resource.del()
);

app.all('/:id/run', allow('POST'));

app.post(
	'/:id/run',
	accepts('application/json'),
	is('application/json'),
	authenticated(),
	express.json(),
	resource.load(),
	function(req, res) {
		res.set('Location', 'url-to-result');
		res.send(202, { run: 'id-of-run' });
	}
);

module.exports = app;