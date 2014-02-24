#!/usr/bin/env node

var extend = require('xtend'),
	argv = require('optimist').argv,
	fs = require('fs'),
	express = require('express'),
	//io = require('socket.io')(),
	api = require('./lib/api'),
	allow = require('./lib/allow'),
	accepts = require('./lib/accepts'),
	authenticated = require('./lib/authenticated'),
	cookieName = 'sid',
	cookieParser = express.cookieParser('asdad'),
	mongoose = require('mongoose').createConnection('mongodb://localhost/cmpt-474'),
	models = require('./lib/models')(mongoose);


var app = express(),
	config = JSON.parse(fs.readFileSync(__dirname+'/config.default.json')),
	manifest = JSON.parse(fs.readFileSync(__dirname+'/package.json'));

var versioning = (function() {
	var branch = fs.readFileSync('.git/HEAD').toString('utf8').match(/ref:\s*refs\/heads\/(.*)/)[1],
		commit = fs.readFileSync('.git/refs/heads/'+branch);
	return {
		package: manifest.version,
		branch: branch,
		commit: commit,
		headers: function() { 
			return function(req, res, next) {
				res
					.set('X-Active-Commit', commit)
					.set('X-Active-Branch', branch);
				next();
			}
		}
	}
})()

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

for (var entry in config.paths)
	config.paths[entry] = fs.realpathSync(config.paths[entry]);

if (argv['version']) {
	process.stdout.write(''+versioning.package+"\n");
	return process.exit(0);
}

if (argv['show-config']) {
	process.stdout.write(JSON.stringify(config, null, '\t')+'\n');
	return process.exit(0);
}

// Set the base URL
app.set('base', '');

app.set('view engine', 'jade');
app.locals.basedir = app.get('views');

function error(err, req, res, next) {
	//Since only the developers are going to see this error
	//just pipe the data right back to them.
	
	var types = [
		'application/json', 
		'application/xml+xhtml', 
		'text/html', 
		'text/plain'
	];

	var code = err.statusCode || 500;

	console.log(err,err.stack);

	switch(req.accepts(types)) {
	case 'application/json':
		return res.send(code, err.stack ? err.stack : { error: 'SOMETHING' });
	case 'application/xml+xhtml':
	case 'text/html':
		return res.status(code).render('errors/'+code, { error: err, statusCode: code });
	case 'text/plain':
	default:
		return res.send(code, 'HTTP '+code+' error: '+err);
	}
}

app.configure('production', 'development', function() {


	var redis = require('redis').createClient(), RedisStore = require('connect-redis')(express);
	app.set('redis', redis);
	app.set('session store', new RedisStore({ client: redis }));
	app.set('secret key', config.secretKey)

	app.set('authentication delay', 1000);
})

//Production configuration settings
app.configure('production', function() {
	//Allow for compressed responses to save on bandwidth
	app.use(express.compress());

	
})



//Development/testing configuration settings
app.configure('development', function() {
	//Log requests
	app.use(express.logger('dev'))
});



//Testing configuration settings
app.configure('test', function() {
	//Use a mock instead of the real thing for testing
	app.set('redis', require('redis-mock').createClient());
	app.set('secret key', null);
	app.set('authentication delay', 1);
	app.use(express.logger('dev'))

	
});



var roles = require('./lib/roles')(app.get('redis'));

roles.put('admin', 'cas:mis2').put('admin', 'cas:ted');

var authorize = {
	role: require('./lib/authorization/role')(roles)
}

//Export application version for debugging
app.use(versioning.headers());

//Export static content
app.use('/styles', express.static(__dirname+'/assets/styles'));
app.use('/scripts', express.static(__dirname+'/assets/scripts'));
app.use('/images', express.static(__dirname+'/assets/images'));
app.use('/fonts', express.static(__dirname+'/assets/fonts'));

//Session handling
app.use(cookieParser);
app.use(express.session({
	store: app.get('session store'),
	secret: app.get('secret key')
}));

var session = require('./lib/authentication/session');


//Allow all requests to be authenticated via an API-key
app.use('/', api.authenticate());
//Allow all requests to be authenticated via sessions
app.use(session());


var url = require('url');
app.use(function(req, res, next) {
	res.url = function(parts) {
		parts.protocol = parts.protocol || req.protocol;
		parts.host = parts.hostname ? undefined : parts.host || req.get('host');
		parts.pathname = app.get('base') + parts.path;
		return url.format(parts);
	}
	next();
});

//Expore some useful information to the templates
app.use(function(req, res, next) {
	res.locals.url = res.url;
	res.locals.path = req.path;
	res.locals.authentication = {
		authenticated: req.authenticated,
		principal: req.principal
	}
	next();
});


//Rate-limiting so people can't abuse the server too much
//by doing fun things like DoSing it (though I'm sure some
//form of DoS is possible this maybe helps a little). Simply
//enhancing your calm.
if (config.requests.rate)
	app.use('/', require('./lib/rate-limit')(config.requests.rate));

//Only allow GET on /
app.all('/', allow('GET'));

app.get('/', accepts('application/json', 'text/html', 'application/xhtml+xml'));

//Simple test route to ensure an API-key is working
//by allowing both authenticated and unauthenticated
//users to get the resource.
app.get(
	'/', 
	accepts.on('application/json'),
	authenticated({ required: false }),
	function(req, res) {
		res.send(200, { 
			version: versioning.package, 
			name: 'cloud',
			authentication: req.authentication,
			principal: req.principal
		});
	}
);

//The 
app.get(
	'/',
	accepts.on('text/html', 'application/xhtml+xml'),
	function(req, res) {
		res.render('index')
	}
);

var redirect = require('./lib/redirect');
app.get('/logout', session.deauthenticate(), redirect('/'))
app.get('/login/cas', require('./lib/authentication/cas')(), session.authenticate(), redirect('/'));
//app.get('/login/facebook', require('./authentication/facebook')(appId, appSecret, ['email']), session.authenticate());





app.get('/assignments', accepts('application/json', 'text/html', 'application/xhtml+xml'));

app.get(
	'/assignments', 
	accepts.on('text/html', 'application/xhtml+xml'),
	function(req, res, next) {
		models.Assignment.find({ parent: null }).sort('start').exec(function(err, assignments) {
			if (err) return next(err);
			return res.render('assignments', {
				assignments: assignments
			});
		});
	}
);


app.get('/assignments/:id', accepts('application/json', 'text/html', 'application/xhtml+xml'), function(req, res, next) {
	models.Assignment.findOne({ key: req.params.id, parent: null }, function(err, assignment) {
		if (err) return next(err);
		if (!assignment) return next({ statusCode: 404 });
		req.assignment = assignment;
		next();
	});
});


app.get(
	'/assignments/:id',
	accepts.on('text/html', 'application/xhtml+xml'),
	function (req, res, next) {
		var assignment = req.assignment;
			

		function kiddies(assignment, next) {
			assignment.getChildren(function(err, children) {
				if (err) return next(err);
				assignment.children = children;
				async.forEach(children, function(child, next) {
					kiddies(child, next);
				}, next);
			});
		}

		kiddies(assignment, function(err) {
			load(assignment, { principal: req.principal }, function(err, context) {
				if (err) return next(err);
				console.log(context);
				res.render('assignment', {
					assignment: assignment,
					context: context
				});
			});
		})

		
	}
);

app.get(
	'/assignments/:id/submissions',
	accepts.on('text/html', 'application/xhtml+xml'),
	function(req, res) {
		res.end();
	}
);

app.get(
	'/assignments/:id/submissions',
	accepts.on('application/json'),
	function(req, res) {
		res.end();
	}
);





var async = require('async');


function inheritable(current, property) {
	while (current && current[property] && current[property] === 'inherit')
		current = current.parentNode;
	if (!current || !current[property] || current[property] === 'none')
		return undefined;
	return current[property];
}

var loaders = [{
	key: "children",
	callback: function(assignment, context, next) {
		async.map(assignment.children, function(child, next) {
			load(child, context, next)
		}, next)
	}
},{ 
	key: "evaluation", 
	callback: function(assignment, context, next) {
		//models.Evaluation.find({ assignment: assignment,  })
		models.EvaluationSettings.findOne({ assignment: assignment }, function(err, settings) {
			if (err || !settings) return next(err);
			next(undefined, settings);
		})
		
		
	} 
}, {
	key: "boilerplate",
	callback: function(assignment, context, next) {
		models.Boilerplate.findOne({ assignment: assignment }).populate('repository').exec(next);
	}
}, {
	key: "submission",
	callback: function(assignment, context, next) {

		async.auto({
			'settings': function settings(next) {
				models.SubmissionSettings.findOne({ assignment: assignment }, next);
			},
			'submissions': function submissions(next) {
				models.Submission.find({ assignment: assignment, owner: context.principal }, next);
			},
			'configuration': ['settings', function configuration(next, data) {
				if (!data.settings) return next();
				switch(data.settings.mode) {
				case 'git':

					return models.SubmissionRepository.findOne({ assignment: assignment, target: context.principal }).populate('repository').exec(function(err, item) {
						if (err) return next(err);
						if (!item) {
							var repository = new models.Repository({ owner: context.principal });
							var link = new models.SubmissionRepository({ assignment: assignment, target: context.principal, repository: repository });
							repository.save(function(err) {
								if (err) return next(err);
								link.save(function(err) {
									if (err) return next(err);
									return next(undefined, { repository: repository });
								});
							});							
						}
						else {
							console.log('returning repo!');
							return next(undefined, { repository: item.repository });
						}
					});
				case 'disabled':
					return next(undefined);
				default:
					return next({ error: 'UNKNOWN_THING' });
				}
			}]
		}, next);

		
	}
}];


function load(component, context, done) {

	async.map(loaders, function(loader, next) {
		loader.callback(component, context, function(err, data) {
			if (err) return next(err);
			else next(undefined, { key: loader.key, value: data })
		})
	}, function(err, result) {
		if (err) return done(err);
		return done(undefined, result.reduce(function(out, entry) {
			return out[entry.key] = entry.value, out;
		}, { }));
	});
}

models.Repository.schema.set('repository path', './var/repositories');


app.param('repository', function(req, res, next, repo) {
	models.Repository.findById(repo, function(err, repository) {
		if (err) return next(err);
		if (!repository) return next({ statusCode: 404 });
		req.repository = repository;
		next();
	});
});

var git = require('./lib/git');

//upload-pack for user requesting to read data
app.post(
	'/code/:repository/git-upload-pack',
	//authenticate.keyring(),
	//authenticated(),
	//authorize.owner(),
	git.uploadPack()
);

//receive-pack for user requesting to write data
app.post(
	'/code/:repository/git-receive-pack',
	//authenticate.keyring(),
	//authorize.owner(),
	git.receivePack()
);
		

app.get('/code/:repository/info/refs',
	//authenticate.keyring(),
	//authorize.owner(),
	git.refs()
);


// If we've reached this point nothing has handled our request
// so just 404 it.
app.use(function(req, res, next) {
	error({ statusCode: 404 }, req, res, next);
});

//Error handling in production environments
app.configure('production', function() {
	app.use(function(err, req, res, next) {
		//Since we're in production mode sending data back to
		//the user might be harmful (sensitive data) so just
		//provide the user with a generic response
		error({ statusCode: err.statusCode || 500 }, req, res, next);
	});
})

//Error handling in development environments
app.configure('test', 'development', function() {
	app.use(error);
});



models.Repository.findById('530952d93cb9ff5b3c99761d', function(err, repo) {
	if (err) return;
	repo.getBranch('master', function(err, branch) {
		console.log(err,branch);
		branch.getCommit(function(err, commit) {
			console.log(commit);
		})
	})
})

/*
io.set('authorization', function (data, callback) {
	if(!data.headers.cookie)
		return callback({ error: 'NO_COOKIE' }, false);
	
	// We use the Express cookieParser created before to parse the cookie
	// Express cookieParser(req, res, next) is used initialy to parse data in "req.headers.cookie".
	// Here our cookies are stored in "data.headers.cookie", so we just pass "data" to the first argument of function
	cookieParser(data, { }, function(parseErr) {
		if(parseErr) { return callback({ error: 'INVALID_COOKIE' }, false); }

		// Get the SID cookie
		var sidCookie = (data.secureCookies && data.secureCookies[cookieName]) ||
			(data.signedCookies && data.signedCookies[cookieName]) ||
			(data.cookies && data.cookies[cookieName]);

		// Then we just need to load the session from the Express Session Store
		app.get('session store').load(sidCookie, function(err, session) {
			// And last, we check if the used has a valid session and if he is logged in
			if (err || !session || !session.principal) {
				callback({ error: 'NOT_AUTHENTICATED' }, false);
			} else {
				// If you want, you can attach the session to the handshake data, so you can use it again later
				data.principal = session.principal;
				callback(null, true);
			}
		});
	});
});
*/

//If we're being called as node server.js then create
//the server and listen on the appropriate addresses/ports.
if (require.main === module) {
	require('http').createServer(app).listen(8798, 'localhost');
}

//Export the app if anyone else wants to use it
//as middleware for something.
module.exports = app;