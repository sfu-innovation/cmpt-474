#!/usr/bin/env node

var extend = require('xtend'),
	argv = require('optimist').argv,
	fs = require('fs'),
	express = require('express'),
	CookieParser = require('cookie-parser'),
	compress = require('compression'),
	api = require('./api'),
	allow = require('./allow'),
	accepts = require('./accepts'),
	authenticated = require('./authenticated'),
	session = require('express-session'),
	cookieName = 'sid',
	env = process.env.NODE_ENV || 'development',
	mongoose = new (require('mongoose').Mongoose)();


mongoose.connect('mongodb://localhost/cmpt-474');

var app = express(),
	path = fs.realpathSync(__dirname+'/../'),
	config = JSON.parse(fs.readFileSync(path+'/config.default.json'));

var versioning = require('./versioning')(path);

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

//for (var entry in config.paths)
//	config.paths[entry] = fs.realpathSync(config.paths[entry]);

if (argv['version']) {
	process.stdout.write(''+versioning.package+"\n");
	return process.exit(0);
}

if (argv['show-config']) {
	process.stdout.write(JSON.stringify(config, null, '\t')+'\n');
	return process.exit(0);
}


app.set('mongoose', mongoose);

// Set the base path
app.set('path', path);
// Set the base URL
app.set('base', '');

// Setup the view engine
app.set('view engine', 'jade');
app.locals.basedir = app.get('views');

if (env === 'production' || env === 'development') {
	var redis = require('redis').createClient(), RedisStore = require('connect-redis')(session);
	app.set('redis', redis);
	app.set('session store', new RedisStore({ client: redis }));
	app.set('secret key', config.secretKey)
	app.set('authentication delay', 1000);
}

//Production configuration settings
switch(env) {
case 'production':
	//Allow for compressed responses to save on bandwidth
	app.use(compress());
	break;
case 'development':
	//app.use(express.logger('dev'))
	break;
case 'test':
	//Use a mock instead of the real thing for testing
	app.set('redis', require('redis-mock').createClient());
	app.set('secret key', null);
	app.set('authentication delay', 1);
	//app.use(express.logger('dev'))
	break;
}

require('./models')(app);


//Export application version for debugging
app.use(versioning.headers());

//Export static content
app.use('/styles', express.static(path+'/assets/styles'));
app.use('/scripts', express.static(path+'/assets/scripts'));
app.use('/images', express.static(path+'/assets/images'));
app.use('/fonts', express.static(path+'/assets/fonts'));
app.use('/ovas', express.static(path+'/assets/ovas'));

var cookieParser = CookieParser(app.get('secret key'));

//Session handling
app.use(cookieParser);
app.use(session({
	// Thanks SFU for also using the default sid and borking
	// over everyone else's express defaults yeeaa
	key: 'innovate.sid',
	store: app.get('session store'),
	//proxy: true
}));

var session = require('./authentication/session');


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
	app.use('/', require('./rate-limit')(config.requests.rate));

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

var redirect = require('./redirect');
app.get('/logout', session.deauthenticate(), redirect('/'))
app.get('/login/cas', require('./authentication/cas')(), session.authenticate(), redirect('/'));
app.get('/login/facebook', require('./authentication/facebook')('XXX', 'YYY', ['email']), session.authenticate(), redirect('/'));


app.param('evaluation', get('Evaluation'));

app.get('/evaluation/:evaluation', accepts('application/json', 'text/html', 'application/xhtml+xml'));

app.get(
	'/evaluation/:evaluation',
	accepts.on('text/html', 'application/xhtml+xml'),
	function (req, res) {
		return res.render('evaluation', {
			evaluation: req.evaluation
		})
	}
);

app.post('/submission/:submission/evaluate', accepts('application/json', 'text/html', 'application/xhtml+xml'));


app.param('submission', get('Submission'));

app.post('/submission/:submission/evaluate', function(req, res, next) {
	if (!req.principal) return next({ statusCode: 403 });
	mongoose.model('Job').discriminators['RunJob']({ 
		submission: req.submission, 
		submitter: req.principal 
	}).enqueue(function(err, run) {
		if (err) return next(err);
		req.run = run;
		next();
	});
});

app.post(
	'/submission/:submission/evaluate',
	accepts.on('application/json'),
	function(req, res) { return res.send(201, req.run) }
);

app.post(
	'/submission/:submission/evaluate',
	accepts.on('text/html', 'application/xhtml+xml'),
	function(req, res) { return res.redirect('/runs/'+req.run.id); }
);

app.param('job', get('Job'));

app.get('/run/:job', function(req, res) { 
	return res.render('run', { job: req.job });
});

app.post('/run/:job/evaluate', function(req, res, next) {
	Job.discriminators['EvaluationJob']({ source: req.job }).enqueue(function(err, job) {
		if (err) return next(err);
	})
});


app.get('/assignments', accepts('application/json', 'text/html', 'application/xhtml+xml'));

app.get(
	'/assignments', 
	accepts.on('text/html', 'application/xhtml+xml'),
	function(req, res, next) {
		mongoose.model('Assignment')
			.find({ parent: null, enabled: true })
			.sort('start')
			.exec(function(err, assignments) {
				if (err) return next(err);
				return res.render('assignments', {
					assignments: assignments
				});
		});
	}
);

app.param('assignment', function(req, res, next, id) {
	mongoose.model('Assignment').findOne({ key: id, parent: null, enabled: true }, function(err, assignment) {
		if (err) return next(err);
		if (!assignment) return next({ statusCode: 404 });
		req.assignment = assignment;
		next();
	});
})

app.get('/assignments/:assignment', accepts('application/json', 'text/html', 'application/xhtml+xml'));


app.get(
	'/assignments/:assignment',
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
				//console.log(context);
				res.render('assignment', {
					assignment: assignment,
					context: context
				});
			});
		})

		
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

var loaders = {
	children: ["assignment", function(next, data) {
		async.map(data.assignment.children, function(child, next) {
			load(child, context, next)
		}, next)
	}],
	boilerplate: ["assignment", function(next, data) {
		mongoose.model('Boilerplate').findOne({ assignment: data.assignment }).populate('repository').exec(next);
	}],
	submission: ["assignment", "context", function(next, data) {
		var assignment = data.assignment, context = data.context;
		async.auto({
			'settings': function settings(next) {
				mongoose.model('SubmissionSettings').findOne({ assignment: assignment }, next);
			},
			'submissions': function submissions(next) {
				if (!context.principal) return next();
				mongoose.model('Submission')
					.find({ assignment: assignment, owner: context.principal })
					.sort({ at: -1 })
					.limit(10)
					.exec(next);
			},
			'key': function key(next) {
				if (!context.principal) return next();
				var SecureKey = mongoose.model('SecureKey');
				SecureKey.open('git', context.principal, next);
			},
			'configuration': ['settings', 'key', function configuration(next, data) {
				if (!data.settings) return next();
				if (!context.principal) return next();

				switch(data.settings.mode) {
				case 'git':

					return mongoose.model('SubmissionRepository').findOne({ assignment: assignment, target: context.principal }).populate('repository').exec(function(err, item) {
						if (err) return next(err);
						if (!item) {
							var repository = mongoose.model('Repository')({ owner: context.principal });
							var link = mongoose.model('SubmissionRepository')({ assignment: assignment, target: context.principal, repository: repository });
							repository.save(function(err) {
								if (err) return next(err);
								link.save(function(err) {
									if (err) return next(err);
									return next(undefined, { repository: repository });
								});
							});							
						}
						else {
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
	}],
	evaluation: ["submission", "assignment", "context", function(next, data) {
		async.auto({
			'settings': function(next) { 
				mongoose.model('EvaluationSettings').findOne({ assignment: data.assignment }, next)
			},
			repository: function(next) {
				if (!data.submission.configuration) return next();
				mongoose.model('EvaluationRepository').findOne({ repository: data.submission.configuration.repository }).exec(function(err, item) {
					if (err) return next(err);
					if (item) return next();
					item = mongoose.model('EvaluationRepository')({ repository: data.submission.configuration.repository }).save(function(err) {
						if (err) return next(err);
						next();
					});
				})
			},
			'evaluations': function(next) {
				mongoose.model('Evaluation')
					.find({ assignment: data.assignment.id, target: data.context.principal })
					.sort({ at: -1 })
					.limit(10)
					.exec(next);
			}
		}, next);
	}]
};


function load(component, context, done) {
	async.auto(extend(loaders, { 
		assignment: function(next) { next(undefined, component); },
		context: function(next) { next(undefined, context) }
	}), done);
}

function get(name) {
	var model = mongoose.model(name), key = name.toLowerCase();
	return function(req, res, next, id) {
		if (req[key]) return next();
		model.findById(id, function(err, result) {
			if (err) return next(err);
			if (!result) return next({ statusCode: 404 });
			if (typeof req[key] !== 'undefined') return next({ statusCode: 500, error: 'ALREADY_EXISTS', key: key, value: req[key] });
			req[key] = result;
			next();
		});
	}
}


app.param('repository', get('Repository'))

mongoose.model('Repository').schema.set('repository path', app.get('path')+'/var/repositories');

function onlyOwner(noPub) {
	return function(req, res, next) {
		// Allow authenticated IPs everything
		if (/^ip:.*/.test(req.principal)) return next();
		// Allow Ted and Izaak everything
		if (['cas:ted','cas:mis2'].indexOf(req.principal) !== -1) return next();
		if (!noPub && req.repository.public) return next();
		//console.log(req.principal,'vs',req.repository.owner)
		if (!req.principal) return next({statusCode: 401});
		if (req.principal !== req.repository.owner) return next({ statusCode: 403 });
		next();
	}
}

var git = require('./git'), 
	authSK = require('./authentication/secure-key')(mongoose.model('SecureKey')),
	authIP = require('./authentication/ip')();
	//authPKI = require('./authentication/pki')();


/*
//LDAPTLS_REQCERT=never ldapwhoami -H ldaps://bulletf.sfu.ca:8636 -D uid=XXX,ou=people,dc=sfu,dc=ca -W

opts = {
	// Off we go!
	url: 'ldaps://bulletf.sfu.ca:8636',
	// Since SFU uses their own internal certificate that isn't signed by anything
	tlsOptions: { rejectUnauthorized: false }
};

var dn = 'uid=%s,ou=people,dc=sfu,dc=ca';
*/

var authLocalIp = authIP(['innovate.cs.surrey.sfu.ca']),
	authGit = authSK('git');

//upload-pack for user requesting to read data
app.post(
	'/code/:repository/git-upload-pack',
	authGit,
	authLocalIp,
	authenticated(false),
	onlyOwner(),
	git.uploadPack()
);

//receive-pack for user requesting to write data
app.post(
	'/code/:repository/git-receive-pack',
	authGit,
	authLocalIp,
	authenticated(),
	onlyOwner(true),
	git.receivePack()
);
		

app.get('/code/:repository/info/refs',
	authGit,
	authLocalIp,
	authenticated(false),
	onlyOwner(),
	git.refs()
);

var querystring = require('querystring');

// Alias submissions to something memorable
app.all(
	'/assignments/:assignment/submissions/*',
	authSK('git'),
	authenticated(),
	//accepts.on(/^application\/x-git.*$/),
	function(req, res, next) {
		var 
			EvaluatorRepository = mongoose.model('EvaluatorRepository'),
			settings = { evaluator: req.principal, assignment: req.assignment };
		EvaluatorRepository.findOne(settings).populate('repository').exec(function(err, result) {
			if (err) return next(err);
			if (result) return res.redirect(result.repository.url+'/'+req.params[0]+'?'+querystring.stringify(req.query));
			EvaluatorRepository(settings).save(function(err, result) {
				if (err) return next(err);
				return res.redirect(result.repository.url);
			});
		});
	}
);

// Alias the boilerplate to something memorable
app.all('/assignments/:assignment/boilerplate/*', function(req, res, err) {
	mongoose.model('Boilerplate')
		.findOne({ assignment: req.assignment })
		.populate('repository')
		.exec(function(err, boilerplate) {
			if (err) return next(err);
			if (!boilerplate) return next({ statusCode: 404 });
			return res.redirect(boilerplate.repository.url+'/'+req.params[0]+'?'+querystring.stringify(req.query));
		});
});


// If we've reached this point nothing has handled our request
// so just 404 it.
app.use(function(req, res, next) {
	next({ statusCode: 404 });
});

var error = require('./error');

//Since we're in production mode sending data back to
//the user might be harmful (sensitive data) so just
//provide the user with a generic response
app.use(error(env === 'production' || env === 'test'));

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


// Export the app if anyone else wants to use it
// as middleware for something.
module.exports = app;
