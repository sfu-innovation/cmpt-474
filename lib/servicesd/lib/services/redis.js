
var extend = require('xtend'),
	Service = require('../service'),
	util = require('util');

function RedisService(binary, config) {
	Service.call(this);
	this.config = config;
	this.binary = binary;
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

RedisService.prototype.heartbeat = function(callback) {
	redis.createClient({
		port: config.port,
		host: 'localhost'
	}).ping(function(err, data) {
		callback(err, data === 'PONG');
	})
}

RedisService.prototype.setup = function(manager, config, callback) {
	async.series([
		function(next) {
			if (!config.data) return next();
			manager.fetch({
				destination: path+'/dump.rdb', 
				source: config.data
			}, next);
		}
	], callback);
}

RedisService.prototype.start = function(manager) {
	
	var connection = manager.connection({
		port: this.config.port || null,
		address: this.config.bind || null
	});
	
	var args = RedisService.config(extend(this.config, {
		port: connection.port,
		bind: connection.address
	}));

	var process = manager.spawn(this.binary, args);

	return {
		process: process, 
		connection: connection
	}
}

RedisService.prototype.stop = function() {
	context.process.stop();
	context.connection.destroy();
}


function RedisProvider(config) {
	this.binary = config.binary || 'redis-server';
	this.whitelist = config.whitelist || false;
	this.defaults = config.defaults || { };
}
RedisProvider.name = "redis";

RedisProvider.prototype.create = function(config) {
	config = extend({ }, config);
	if (this.whitelist) {
		for (var key in config)
			if (!this.whitelist[key])
				delete config[key];
	}
	return new RedisService(this.binary, extend(this.defaults, config));
}

module.exports = RedisProvider;