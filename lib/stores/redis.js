
var redis = require('redis');

function Redis(config) {
	this.redis = config.redis || redis.createClient(config.port, config.host);
}

Redis.prototype.key = function(model, entity) {
	if (typeof entity === 'object') entity = entity.id;
	return '/'+model.name+'/'+entity;
}

Redis.prototype.put = function(model, entity, callback) {
	var key = this.key(model, entity), redis = this.redis, data;
	try { data = JSON.stringify(entity); }
	catch (E) { return callback(E); }
	redis.set(key, data, function(err, created) {
		return callback(err, entity, created);
	});
}

Redis.prototype.get = function(model, entity, callback) {
	var key = this.key(model, entity), redis = this.redis;
	redis.exists(key, function(err, exists) {
		if (err) return callback(err);
		if (!exists) return callback(undefined, null);
		redis.get(key, function(err, data) {
			if (err) return callback(err);
			var obj;
			try { obj = JSON.parse(data); }
			catch (E) { return callback(E) }
			callback(undefined, obj);
		})
	})
}

Redis.prototype.delete = function(model, entity, callback) {
	var key = this.key(model, entity), redis = this.redis;
	redis.del(key, function(err, count) {
		if (err) return callback(err);
		return callback(undefined, count > 0);
	})
}

module.exports = Redis;