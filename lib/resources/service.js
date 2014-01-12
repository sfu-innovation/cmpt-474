var express = require('express'),
	authenticated = require('../authenticated'),
	authorized = require('../authorized'),
	allow = require('../allow'),
	roles = require('../roles'),
	is = require('../is'),
	accepts = require('../accepts');

var app = express();

app.all('/', allow('POST'));

module.exports = app;

