
var redis = require('redis'),
	async = require('async'),
	extend = require('xtend'),
	Service = require('../service'),
	util = require('util');

function RedisService(service, settings) {
	Service.call(this, service);
	this.configuration = settings.configuration;
	this.binary = settings.binary;
	this.path = null;
	this.data = settings.data;
}
util.inherits(RedisService, Service);

RedisService.config = function(obj) {
	function normalize(attr, val) {
		switch(typeof val) {
		case 'boolean':
			return [attr, val ? 'yes' : 'no'];
		case 'string':
		case 'number':
			return [attr, ''+val];
		case 'object':
			if (Array.isArray(val))
				return val.reduce(function(result, val) {
					return result.concat(normalize(attr, val));
				}, []);
		default:
			throw new TypeError();
		}
	}

	var buf = [ ];
	for (var key in obj) 
		buf = buf.concat(normalize('--'+key.replace(/([A-Z])/g, '-$1').toLowerCase(), obj[key]));
	return buf;
}

RedisService.prototype._heartbeat = function(callback) {
	var client = redis.createClient(this.connection.port, this.connection.address);
	client.ping(function(err, data) {
		callback(err, data === 'PONG');
	});
}

RedisService.prototype._information = function(callback) {
	callback(undefined, {
		configuration: this.configuration,
		binary: this.binary,
		data: this.data
	});
}

RedisService.prototype._setup = function(manager, callback) {
	var service = this;
	async.series([
		function(next) {
			manager.directory(service, function(err, path) {
				if (err) return next(err);
				service.path = path;
				next();
			});
		},
		function(next) {
			if (!service.data) return next();
			manager.fetch(service, {
				destination: service.path+'/dump.rdb', 
				source: service.data
			}, next);
		},
		function(next) {
			var connection = manager.connection(service, {
				port: service.configuration.port || null,
				address: service.configuration.bind || null
			}, function(err, result) {
				if (err) return next(err);
				service.connection = result;
				next();
			});
		},
		function(next) {

			var args = RedisService.config(extend({ }, service.configuration, {
				port: service.connection.port,
				bind: service.connection.address,
				dir: service.path
			}));
			var process = manager.process(service, service.binary, args, { cwd: service.path });
			process.on('error', function(err) {
				service.emit('error');
			}).on('start', function() {
				service.state = 'started';
			}).on('stop', function() {
				service.state = 'stopped';
			}).on('restart', function() {
				service.state = 'started';
			}).on('exit', function() {
				service.state = 'stopped';
			});
			service.process = process;
		}
	], callback);
}

RedisService.prototype._start = function(manager) {
	this.process.start();
}

RedisService.prototype._restart = function(manager) {
	this.process.restart()
}

RedisService.prototype._stop = function(manager) {
	this.process.stop();
	this.connection.destroy();
}


function RedisProvider(config) {
	this.binary = config.binary || 'redis-server';
	this.whitelist = config.whitelist || false;
	this.defaults = config.defaults || { };
	this.allowData = true;
}
RedisProvider.key = "redis";

RedisProvider.prototype.create = function(service, settings) {
	//Create a copy of the configuration
	var config = extend({ }, settings);
	//If Redis configuration options have been whitelisted
	if (this.whitelist) {
		//Go through the user supplied key
		for (var key in config)
			//Strip anything that isn't in the whitelist
			if (!this.whitelist[key])
				delete config[key];
	}
	
	//Create the service
	return new RedisService(service, {
		binary: this.binary,
		configuration: extend(this.defaults, config),
		data: this.allowData ? settings.data : null
	});
}

module.exports = RedisProvider;