
var extend = require('xtend');

function RedisService(config) {
	this.config = config;
}

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

RedisService.prototype.program = function() {
	return { 
		program: 'redis-server', 
		parameters: RedisService.config(this.config) 
	};
}

function RedisProvider(config) {
	this.binary = config.binary || 'redis-server';
	this.whitelist = config.whitelist || false;
	this.defaults = config.defaults || { };
}

RedisProvider.prototype.create = function(config) {
	config = extend({ }, config);
	if (whitelist) {
		for (var key in config)	
	}
	return new RedisService();
}

module.exports = RedisProvider;