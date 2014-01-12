
module.exports = {
	authorize: function(name) {
		return function(req, res, next) {
			var redis = this.get('store');
			redis.sismember('/roles/'+name, req.apiKey, function(err, result) {
				if (err) return next(err);
				if (result) req.authorized = true;
				next();
			})
		}
	}
}
