
var express = require('express');

module.exports = function(logger) {

	var app = express();

	app.use(function(req, res, next) {
		logger.log('verbose', 'request', { }, next);
	});

	app.use(function(err, req, res, next) {
		logger.log('error', 'middleware error', err, next);
	});

	return app;

}