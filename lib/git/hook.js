#!/usr/bin/env node

var app = require(__dirname+'/../app'),
	extend = require('xtend'),
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


var mongoose = app.get('mongoose'),
	Hook = mongoose.model('RepositoryHook'),
	Repository = mongoose.model('Repository');

var id = process.env['REPO_ID'];

if (!id) return done({ error: 'NO_ID' })

Repository.findById(id, function(err, repo) {
	if (err) return done(err);
	if (!repo) return done({ error: 'NO_REPOSITORY' });

	Hook.find({ repository: id, type: kind }).populate('template').exec(function(err, hooks) {
		
		if (err) return done(err);
		
		bootstrap(function(err, input) {
			if (err) return done(err);
			// Build a dependency chain for async.auto such that it looks like
			// hook[name] = [ depA, depB, ..., callback ].
			// FIXME: Hooks dependent by name the best choice?
			var chain = { };
			hooks.forEach(function(hook) {
				
				// If there is no template, fail silently.
				// FIXME: Better error reporting here.
				if (!hook.template) return;

				// Check to see if the hook is enabled, and if not then
				// just silently ignore it.
				if (typeof hook.enabled !== 'undefined' && !hook.enabled) return;
				if (typeof hook.enabled === 'undefined' && !hook.template.enabled) return;
				
				var runner = require(hook.template.script), 
					//merge hook.source.data and hook.data
					data = extend(hook.template.data, hook.data, { });
				
				chain[hook.template.name] = (hook.template.needs || []).concat(function(next, priors) {
					async.map(input, function(chunk, next) {
						runner(app, repo, data, request, chunk, priors, next);
					}, next);
				})
			});

			async.auto(chain, done);
		});
	});

});

