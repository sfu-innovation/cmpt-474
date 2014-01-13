
var redis = require('redis')
	async = require('async');

//NOTE: The way this indexes data is absolute garbage, but
//it's the fastest way to get things working so that' what
//it is for now. Will change later.

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

	async.map(model.properties, function(property, next) {
		if (!property.index) return next(undefined, 'NI');
		var key = '/'+model.name+'/'+property.name+'/'+entity[property.name];
		redis.set(key, data, next);
	}, function(err, results) {
		callback(err, entity, true);
	});
	
}

Redis.prototype.get = function(model, entity, callback) {
	var key = this.key(model, entity), redis = this.redis;

	if (typeof entity === 'string') entity = { id: entity };

	async.reduce(Object.getOwnPropertyNames(entity), false, function(results, property, next) {
		if (!model.getProperty(property)) return next('unknown property '+property);
		property = model.getProperty(property);
		if (!property.index) return next('non-indexed property '+property.name);
		var key = '/'+model.name+'/'+property.name+'/'+entity[property.name];
		if (property.unique) {
			redis.get(key, function(err, data) {
				if (err) return next(err);
				if (!data) return next(undefined, []);
				var obj;
				try { obj = JSON.parse(data); }
				catch (E) { return callback(E) }
				return next(undefined, !results ? [obj] : results.filter(function(result) {
					return result.id === obj.id;
				}));
			});
		}
		else {
			redis.smembers(key, function(err, members) {
				if (err) return next(err);
				var objs = [ ];
				try {
					objs = members.map(function(member) {
						return JSON.parse(member);
					})
				} catch(E) {
					return next(E);
				}
				return next(undefined, !results ? objs : results.filter(function(result) {
					return objs.some(function(obj) { return obj.id === result.id });
				}));
			});
		}
	}, callback)
}

Redis.prototype.delete = function(model, entity, callback) {
	
	function work(entity, callback) {
		async.map(model.properties, function(property, next) {
			if (!property.index) return next(undefined, 'NI');
			var key = '/'+model.name+'/'+property.name+'/'+entity[property.name];
			redis.del(key, next);
		}, callback);
	}

	this.get(model, entity, function(err, results, next) {
		async.map(results, work, next)
	}, callback);
}

module.exports = Redis;