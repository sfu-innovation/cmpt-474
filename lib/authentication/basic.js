
module.exports = function(checkPassword) {
	return function(req, res, next) {
		var parts = req.get('authorization').split(' ', 2);
		if (parts[0] !== 'Basic') 
			return failure();
		
		parts = Buffer(parts[1], 'base64').toString('utf8').split(':', 2);
		req.authentication = parts;

		var user = parts[0];

		checkPassword(user, parts[1], function(err, status, principal) {
			if (err) return next(err);
			if (!status) { req.authenticated = false; next(); }
			req.authenticated = true;
			req.principal = principal || 'basic:'+user;
			next();
		});

		return next();
	}
}