var express = require('express');

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
	'/'
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
)

module.exports = app;