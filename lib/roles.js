
module.exports = {
	authorize: function(name) {
		return function(req, res, next) {
			var store = req.app.get('store');
			store.get(as, function(err, result) {
				if (err) return next(err);
				if (result) req.authorized = true;
				next();
			});
		}
	}
}
