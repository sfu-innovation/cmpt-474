#!/usr/bin/env node

var extend = require('xtend'),
	argv = require('optimist').argv,
	fs = require('fs'),
	express = require('express'),
	api = require('./lib/api'),
	allow = require('./lib/allow'),
	accepts = require('./lib/accepts'),
	winston = require('winston'),
	authenticated = require('./lib/authenticated');
	

var app = express(),
	config = JSON.parse(fs.readFileSync(__dirname+'/config.default.json')),
	manifest = JSON.parse(fs.readFileSync(__dirname+'/package.json'));

//Try to load the JSON configuration file for the system.
try {
	//Either use the user supplied --config file.json option
	//from the command line or the default.
	var file = argv['config'] || './config/index.json';
	//And try and read the JSON data from it
	config = extend(config, JSON.parse(fs.readFileSync(file)));
}
catch (err) {
	//If we're here, reading the config file has failed so
	//let the user know about it and exit the program.
	if (argv['config']) {
		process.stderr.write('unable to load configuration file '+file+': '+err+'\n');
		return process.exit(1);
	}
}

if (argv['version']) {
	process.stdout.write(''+manifest.version+"\n");
	return process.exit(0);
}

if (argv['show-config']) {
	process.stdout.write(JSON.stringify(config)+"\n");
	return process.exit(0);
}


function getPlatform(platforms) {
	if (!Array.isArray(platforms)) 
		throw new TypeError();
	console.log(platforms)
	for (var i = 0; i < platforms.length; ++i) {
		var platform = platforms[i];
		if (platform.enabled === false) 
			continue;
		try {
			return require('./lib/platforms/'+platform.type)(platform.settings);
		}
		catch (E) {
			process.stderr.write('unable to load platform '+platform.type+': '+E+'\n');
			continue;
		}
	}
	throw new Error();
}

app.set('platform', getPlatform(config.platforms));

app.configure('production', 'development', function() {
	var log = winston.loggers.add('default', config.log);
	app.set('log', log);
	app.use(require('./lib/log')(log));

	var Store = require('./lib/stores/'+config.store.type);
	app.set('store', new Store(config.store.settings));	

	app.set('authentication delay', 1000);
})

//Production configuration settings
app.configure('production', function() {
	//Error handling
	app.use(function(err, req, res, next) {
		//Since we're in production mode sending data back to
		//the user might be harmful (sensitive data) so just
		//provide the user with a generic response and let
		//Winston handle everything else
		res.send(500, { message: 'internal server error' });
	});
})

//Development/testing configuration settings
app.configure('development', function() {
	//Error route for generating errors; bad to have on the main
	//site due to people spamming the error handler.
	app.get('/error', function() {
		throw new Error();
	})

	//Error handling
	app.use(function(err, req, res, next) {
		//Since only the developers are going to see this error
		//just pipe the data right back to them.
		res.send(500, err.stack);
	});
});

//Testing configuration settings
app.configure('test', function() {
	var Store = require('./lib/stores/redis');
	//Use a mock instead of the real thing for testing
	app.set('store', new Store({redis: require('redis-mock').createClient()}));
	app.set('authentication delay', 1);
})

//Allow all requests to be authenticated via an API-key
app.use('/', api.authenticate());


//Rate-limiting so people can't abuse the server too much
//by doing fun things like DoSing it (though I'm sure some
//form of DoS is possible this maybe helps a little). Simply
//enhancing your calm.
if (config.requests.rate)
	app.use('/', require('./lib/rate-limit')(config.requests.rate));

//Only allow GET on /
app.all('/', allow('GET'));
//Simple test route to ensure an API-key is working
//by allowing both authenticated and unauthenticated
//users to get the resource.
app.get(
	'/', 
	accepts('application/json'),
	authenticated({ required: false }),
	function(req, res) {
		res.send(200, { 
			version: '1.0.1', 
			name: 'cloud',
			authentication: req.authentication,
			principal: req.principal
		});
	}
);

//List of resources we provide
var resources = [
	'api-key', 
	'location', 
	'company', 
	'instance', 
	'service'
];

//Add them to the application.
resources.forEach(function(resource) {
	app.use('/'+resource, require('./lib/resources/'+resource));
});


app.configure('test', function() {
	//Error handling
	app.use(function(err, req, res, next) {
		//Since only the developers are going to see this error
		//just pipe the data right back to them.
		if (err.stack)
			console.log(err.stack)
		else
			console.log(err);

		res.send(500, err+' '+err.stack);
	});
})

//If we're being called as node server.js then create
//the server and listen on the appropriate addresses/ports.
if (require.main === module) {
	
	//Load up the appropriate modules for the possible
	//protocols we can use.
	var http = require('http'),
		https = require('https');

	(function listen(directive) {
		if (Array.isArray(directive))
			return directive.forEach(directive);
		switch (typeof directive) {
		case 'boolean':
			if (directive) return listen({});
			else return;
		case 'number':
			return listen({ port: directive });
		case 'string':
			return listen({ address: directive });
		case 'object':
			var port = 80, address = null, protocol = 'http';

			if (typeof directive.protocol !== 'undefined')
				protocol = directive.protocol;
			else if (directive.key && directive.cert)
				protocol = 'https';

			if (typeof directive.port !== 'undefined')
				port =  directive.port;

			if (typeof directive.address !== 'undefined')
				address = directive.address;

			switch(protocol) {
			case 'http':
				return http.createServer(app).listen(port, address);
			case 'https':
				return https.createServer({
					key: fs.readFileSync(directive.key), 
					cert: fs.readFileSync(directive.cert)
				}, app).listen(port, address);
			default:
				throw new TypeError('Invalid protocol: "'+protocol+'".');
			}
		default:
			throw new TypeError('Invalid listen directive.');
		}
	})(config.listen);
}

//Export the app if anyone else wants to use it
//as middleware for something.
module.exports = app;