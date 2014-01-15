#!/usr/bin/env node


var Service = require('./service'),
	argv = require('optimist').argv,
	async = require('async'),
	fs = require('fs'),
	UUID = require('com.izaakschroeder.uuid'),
	http = require('http'),
	express = require('express'),
	instanceId = argv['instance-id'],
	instanceKey = argv['instance-key'];
	dataPath = argv['data-path'],
	listen = argv['listen'];

var app = express(),
	config = JSON.parse(fs.readFileSync(__dirname+'/config.default.json')),
	services = [ ];


var providers = fs.readdirSync('./services').filter(function(entry) {
	return entry.match(/^[^.].*\.js$/);
}).map(function(entry) {
	var name = path.basename(entry, '.js')
		provider = new (require('./services/'+entry))(config.services[name]);
	return {
		name: name,
		provider: provider
	}
});

providers.index = { };
providers.forEach(function(type, i, providers) {
	providers.index[type.name] = type;
});

services.index = { };




function serviceable() {
	return function(req, res, next) {
		if (!req.service) return res.send(404, { error: 'NOT_FOUND' });
		else return next();
	}
}



app.param('service', function(req, res, next, id) {
	req.service = services.index[id] ? services.index[id].service : null;
	next();
});

function is(type) {
	return function(req, res, next) {
		if (!req.is(type))
			return res.send(415, { error: 'INVALID_CONTENT_TYPE' });
		next();
	}
}


app.get(
	'/',
	function(req, res, next) {
		async.map(services, function(service, next) {
			service.information(next);
		}, function(err, results) {
			if (err) return next(err);
			res.send(200, { services: results });
		});
		
	}
);

app.post(
	'/',
	is('application/json'),
	express.json(),
	function(req, res) {

	}
);

app.get(
	'/:service',
	serviceable(),
	function(req, res) {
		
		res.send(200, req.service);
	}
);

app.put(
	'/:service',
	is('application/json'),
	express.json(),
	function(req, res) {
		if (req.service) {
			req.service.update(req.body);
			req.service.information(function(err, data) {
				if (err) return next(err);
				return res.send(200, data);
			});
		}
		else {
			var id = req.param('service'),
				service = new Service(id, req.body);
			services.index[id] = { service: service, offset: services.length };
			services.push(service);
			service.information(function(err, data) {
				if (err) return next(err);
				return res.send(201, data);
			});
		}
	}
);

app.del(
	'/:service',
	serviceable(),
	function(req, res) {

	}
);

app.post(
	'/:service/start',
	serviceable(),
	function(req, res) {
		req.service.start();
		res.send(202, { });
	}
);

app.post(
	'/:service/stop',
	serviceable(),
	function(req, res) {
		req.service.stop();
		res.send(202, { });
	}
);

app.post(
	'/:service/configure',
	serviceable(),
	function(req, res) {
		
	}
);

app.get(
	'/:service/log/:type',
	serviceable(),
	function(req, res, next) {
		var log = req.service.log(req.param('type'));
		log.exists(function(err, exists) {
			if (err) return next(err);
			if (!exists) return res.send(404, { error: 'NOT_FOUND' });
			res.status(200);
			log.createReadStream().pipe(res);
		});
		
	}

);

app.post(
	'/:service/ports',
	serviceable(),
	express.json(),
	function(req, res) {
		
	}
);



process.stdin.on('readable', function() {
	//console.log('GOT A MESSAGE!')
})

//Reload the configuration and restart
//all now-active services.
process.on('SIGHUP', function() {
	services.forEach(function(service) {
		service.configure(function(err, callback) {
			service.restart();
		});
	});
})

//Sent by platform to shutdown the instance.
process.on('SIGPWR', function() {
	services.forEach(function(service) {
		service.stop();
	});
});

http.createServer(app).listen(listen);