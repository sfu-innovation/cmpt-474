
module.exports = function(store) {
	return function(allowedRoles) {
		if (!Array.isArray(allowedRoles)) 
			allowedRoles = [allowedRoles];
		return function(req, res, next) {
			async.filter(allowedRoles, function(role, next) {
				roles.contains(role, req.principal, next);
			}, function(err, res) {
				if (err) return next(err);
				req.roles = res;
				if (req.roles.length > 0)
					req.authorized = true;
				next();
			});
		}
	}
}

