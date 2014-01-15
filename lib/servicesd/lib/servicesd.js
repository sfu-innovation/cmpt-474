#!/usr/bin/env node


var Manager = require('./manager'),
	Service = require('./service'),
	argv = require('optimist').argv,
	async = require('async'),
	path = require('path'),
	fs = require('fs'),
	UUID = require('com.izaakschroeder.uuid'),
	http = require('http'),
	express = require('express'),
	instanceId = argv['instance-id'],
	instanceKey = argv['instance-key'];
	dataPath = argv['data-path'],
	listen = argv['listen'];

var app = express(),
	config = JSON.parse(fs.readFileSync(__dirname+'/config.default.json'));


var providers = fs.readdirSync('./services').filter(function(entry) {
	return entry.match(/^[^.].*\.js$/);
}).map(function(entry) {
	var name = path.basename(entry, '.js')
	return new (require('./services/'+entry))(config.services[name]);
});



function is(type) {
	return function(req, res, next) {
		if (!req.is(type))
			return res.send(415, { error: 'INVALID_CONTENT_TYPE' });
		next();
	}
}

function serviceable() {
	return function(req, res, next) {
		if (!req.service) return res.send(404, { error: 'NOT_FOUND' });
		else return next();
	}
}

var manager = new Manager({
	providers: providers,
	path: config.path
});



app.param('service', function(req, res, next, id) {
	req.service = services.index[id] ? services.index[id].service : null;
	next();
});




app.get(
	'/',
	function(req, res, next) {
		async.map(manager.services, function(service, next) {
			service.information(next);
		}, function(err, results) {
			if (err) return next(err);
			res.send(200, { services: results, length: results.length });
		});
		
	}
);

app.post(
	'/',
	is('application/json'),
	express.json(),
	function(req, res, next) {
		manager.put(UUID.generate(), req.body, function(err, service) {
			if (err) return next(err);
			service.information(function(err, data) {
				if (err) return next(err);
				return res.send(201, data);
			})
		})
	}
);

app.get(
	'/:service',
	serviceable(),
	function(req, res, next) {
		req.service.information(function(err, data) {
			if (err) return next(err);
			res.send(200, data);
		});
	}
);

app.put(
	'/:service',
	is('application/json'),
	express.json(),
	function(req, res, next) {
		if (req.service) {
			req.service.update(req.body);
			req.service.information(function(err, data) {
				if (err) return next(err);
				return res.send(200, data);
			});
		}
		else {
			manager.put(req.param('service'), req.body, function(err, service) {
				if (err) return next(err);
				service.information(function(err, data) {
					if (err) return next(err);
					return res.send(201, data);
				});
			})
			
			
		}
	}
);

app.del(
	'/:service',
	serviceable(),
	function(req, res) {
		req.service.delete(function(err) {
			res.send(204, { });
		});
		
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
	'/:service/setup',
	serviceable(),
	function(req, res) {
		req.service.setup(function(err) {
			if (err) return;
			req.service.restart();	
		});
		res.send(202, { });
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

var server = http.createServer(app);

//Reload the configuration and restart
//all now-active services.
process.on('SIGHUP', function() {
	manager.services.forEach(function(service) {
		service.configure();
	});
})

//Sent by platform to shutdown the instance.
process.on('SIGPWR', function() {
	//Shutdown the API
	server.close();
	//Shutdown all services
	manager.services.forEach(function(service) {
		service.stop();
	});

});



server.listen(4354);