
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

RedisService.prototype.start = function() {
	var args = RedisServerInstance.config(config);
	
}

module.exports = RedisService;