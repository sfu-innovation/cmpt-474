
var express = require('express'),
	resource = require('../resource'),
	authenticated = require('../authenticated'),
	authorized = require('../authorized'),
	Company = require('../models/company'),
	resource = require('../resource')(Company);

var app = express();


//----------------------------------------------
//------- COMPANIES
//----------------------------------------------
app.put(
	'/:id',
	authenticated(),
	express.json(),
	resource.parse(),
	resource.put()
);

app.put(
	'/:id/members/:user',
	authenticated(),
	authorized()
);

module.exports = app;
