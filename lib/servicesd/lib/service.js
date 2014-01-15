
var fs = require('fs'),
	fetcher = require('./fetcher'),
	mkdirp = require('mkdirp'),
	async = require('async'),
	path = require('path'),
	rimraf = require('rimraf'),
	url = require('url'),
	child_process = require('child_process'),
	UUID = require('com.izaakschroeder.uuid'),
	Monitor = require('forever-monitor').Monitor,
	Proxy = require('./proxy'),
	EventEmitter = require('events').EventEmitter,
	util = require('util');



function Service(manager, config) {
	EventEmitter.call(this);

	var service = this;

	this.id = id;
	this.state = 'unknown';
	this.service = config.service;
	this.path = config.path;
	this.manager = manager;
	this.program = config.program;

	this.paths = [ ];
	this.paths.index = { };

	this.setPath('logs', config.path + '/logs');
	this.setPath('work', config.path + '/work');
	this.setPath('pids', config.path + '/pids')


	var parts = [this.program.binary].concat(this.program.arguments);
	this.monitor = new Monitor(parts, {
		silent: true,
		max: 8,
		minUptime: 2000,
		spinSleepTime: 1000,
		killTree: true,
		//spawnWith: {
		//	uid: 65534,
		//	gid: 65534
		//},
		outFile: this.path('logs')+'/stdout.log',
		errFile: this.path('logs')+'/stderr.log'
	});

	//this.proxy = new Proxy(servicePort);
	//this.proxy.listen(config.port);

	//Propagate all the interesting stuff outside the sandbox
	this.monitor.on('error', function(err) {
		service.emit('error');
	}).on('start', function() {
		service.state = 'started';
		service.emit('start')
	}).on('stop', function() {
		service.state = 'stopped';
		service.emit('stop');
	}).on('restart', function() {
		service.state = 'restarted';
		service.emit('restart');
	}).on('exit', function() {
		service.state = 'stopped';
		service.emit('exit')
	})
}
util.inherits(Service, EventEmitter);

Service.prototype.setPath = function(name, path) {
	if (typeof this.paths.index[name] !== 'undefined')
		this.paths.index[name].value = path;
	var data = { value: path, index: this.paths.length };
	this.paths.push(data);
	this.paths.index[name] = data;
}

Service.prototype.path = function(name) {
	return this.paths.index[name].path;
}

Service.prototype.clean = function(callback) {
	async.series([
		function files(next) {
			rimraf(this.path, next);
		}
	], callback);
}

Service.prototype.setup = function(callback) {
	var service = this.service;

	async.series([
		
		function directories(next) {
			async.forEach(service.paths, mkdirp, next);
		},
		
		function work(next) {
			if (!service.data) return next();
			fetcher(service.path('work'), service.data, next)
		},

		function type(next) {
			service.service.setup({
				path: service.path('work')
			}, next);
		}

	], function(err) {
		service.configured = !err;
		return callback(err);
	})
	
	
}

Service.prototype.information = function(callback) {
	callback(undefined, {
		id: this.id,
		configured: this.configured,
		state: this.state,
		type: this.type,
		listen: [
			{ address: 'xx', port: 44, proxied: true }
		]
	});
}

Service.prototype.delete = function() {
	this.manager.del(this);
}

Service.prototype.start = function() {
	this.state = 'starting';
	this.monitor.start();
}

Service.prototype.restart = function() {
	this.state = 'restarting';
	this.monitor.restart();
}

Service.prototype.stop = function() {
	this.state = 'stopping';
	this.monitor.stop();
}


module.exports = Service;