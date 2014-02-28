#!/usr/bin/env node

var app = require(__dirname+'/../app'),
	async = require('async'),
	path = require('path'),
	util = require('util'),
	request,
	bootstrap,
	kind;


function done(err) {
	if (err) {
		if (app.settings.env === 'development' || app.settings.env === 'test') {
			process.stderr.write(util.inspect(err));
			if (err.stack) process.stderr.write(util.inspect(err.stack));
		}
		else
			process.stderr.write('hook error');
		return process.exit(1);
	}
	process.exit(0);
}

// FIXME: Is there a more sane way of doing this?
kind = path.basename(process.argv[1]);

try {
	request = process.env['REQUEST_DATA'] ? JSON.parse(process.env['REQUEST_DATA']) : undefined ;
	bootstrap = require(__dirname+'/'+kind);
}
catch (e) {
	return done(e);
}



app.get('mongoose').model('RepositoryHook').find({
	repository: process.env['REPO_ID'],
	kind: kind,
	enabled: true
}, function(err, hooks) {
	if (err) return done(err);
	bootstrap(function(err, data) {
		if (err) return done(err);
		async.forEach(hooks, function(hook, next) {
			var runner = require(hook.script);
			async.forEach(data, function(chunk, next) {
				runner(app, hook.arguments, request, chunk, next);
			}, next);
		}, done);
	});
});
