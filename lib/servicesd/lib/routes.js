
var express = require('express'),
	async = require('async');

module.exports = function(manager) {



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


	var app = express();

	app.param('service', function(req, res, next, id) {
		req.service = manager.service(id);
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
		function(req, res, next) {
			req.service.start(function(err) {
				if (err) return next(err);
				res.send(202, { });
			});
		}
	);

	app.post(
		'/:service/stop',
		serviceable(),
		function(req, res, next) {
			req.service.stop(function(err) {
				if (err) return next(err);
				res.send(202, { });	
			});
			
		}
	);

	app.post(
		'/:service/setup',
		serviceable(),
		function(req, res) {
			req.service.setup(manager, function(err) {
				if (err) {
					console.log('SETUP FAILED '+err);
					return;
				}
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

	return app;
};