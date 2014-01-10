#!/usr/bin/env node

var argv = require('optimist').argv,
	fs = require('fs'),
	http = require('http'),
	https = require('https'),
	express = require('express'),
	app = express(),
	redis = require('redis').createClient(),
	api = require('./lib/api')({ store: redis }),
	roles = require('./lib/roles')({ store: redis }),
	RedisSessionStore = require('connect-redis')(express),
	RedisStore = require('./lib/stores/redis'),
	allowed = require('./lib/allowed'),
	expressWinston = require('express-winston'),
	winston = require('winston'),
	config = undefined;



//Try to load the JSON configuration file for the system.
try {
	//Either use the user supplied --config file.json option
	//from the command line or the default.
	var file = argv.config || './config/index.json';
	//And try and read the JSON data from it
	config = JSON.parse(fs.readFileSync(file));
}
catch (err) {
	//If we're here, reading the config file has failed so
	//let the user know about it and exit the program.
	process.stderr.write('unable to load configuration file '+file+': '+err+'\n');
	process.exit(1);
}

app.get('/error', function() {
	throw new Error();
})

//Rate-limiting so people can't abuse the server too much
//by doing fun things like DoSing it (though I'm sure some
//form of DoS is possible this maybe helps a little). Simply
//enhancing your calm.
app.use('/', api.rateLimit())

//Only allow GET on /
app.all('/', allowed('GET'));
//Simple test route to ensure an API-key is working.
app.get('/', api.authenticate(false), function(req, res) {
	res.send(200, { 
		version: '1.0.1', 
		name: 'cloud',
		apiKey: req.apiKey
	});
})

/*
var config_ = { 
	api: api, 
	roles: roles, 
	store: new RedisStore({ redis: redis })
};
*/
//app.use('/api-key', require('./lib/resources/api-key')(config_))
//app.use('/location', require('./lib/resources/location')(config_))
//app.use('/company', require('./lib/resources/company')(config))
//app.use('/instance', require('./lib/resources/instance')(config))
//app.use('/service', require('./lib/resources/instance')(config))


//Production configuration settings
app.configure('production', function() {

	//Setup the logging configuration by first reading
	//the logging configuration data from the config
	//file and then loading up Winston.
	var transports = config.logging.transports.map(function(transport) {
		return new winston.transports[transport.type](transport.settings);
	});
	
	//Use Winston to report the error messages as per the
	//configuration file.
	app.use(expressWinston.errorLogger({
		transports: transports
	}));

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
app.configure('development', 'test', function() {
	
	//Just log to the console during development mode because
	//why do we need anything else?
	app.use(expressWinston.errorLogger({
		transports: [
			new winston.transports.Console({
				json: false,
				colorize: true
			})
		]
	}));

	//Error handling
	app.use(function(err, req, res, next) {
		//Since only the developers are going to see this error
		//just pipe the data right back to them.
		res.send(500, err.stack);
	});
})


//If we're being called as node server.js then create
//the server and listen on the appropriate ports.
if (require.main === module) {

	//Main service over HTTPs so people don't have fun
	//running wireshark and sniffing out the good stuff.
	https.createServer({
		key: fs.readFileSync(__dirname+'/config/key.pem'), 
		cert: fs.readFileSync(__dirname+'/config/cert.pem')
	}, app).listen(443);

	//Create an app for redirecting HTTP requests to their
	//HTTPS counterparts. If the user has sent sensitive 
	//data to this well... there's not much we can do at that
	//point is there?
	var redirector = express();
	redirector.use('/', function(req, res) {
		res.redirect('https://'+req.headers['host']+req.url);
	});
	http.createServer(redirector).listen(80);

}

//Export the app if anyone else wants to use it
//as middleware for something.
module.exports = app;