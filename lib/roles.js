
module.exports = function(config) {
	
	var redis = config.store;

	return {
		authorize: function(name) {
			return function(req, res, next) {
				redis.sismember('/roles/'+name, req.apiKey, function(err, result) {
					if (err) return next(err);
					if (result) req.authorized = true;
					next();
				})
			}
		},
		add: function(name, member, callback) {
			redis.sadd('/roles/'+name, member, callback);
		},
		remove: function(name, member, callback) {
			redis.srem('/roles/'+name, member, callback);
		},
		members: function(name, callback) {
			redis.smembers('/roles/'+name, callback);
		}
	}
}