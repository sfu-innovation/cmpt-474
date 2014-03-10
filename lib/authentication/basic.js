
module.exports = function(checkPassword) {
	return function(req, res, next) {

		function fail() {
			res.set('WWW-Authenticate', 'Basic')
			next();
		}

		var auth = req.get('authorization'), parts;

		if (!auth) return fail();
		
		parts = auth.split(' ', 2);
		
		if (parts[0] !== 'Basic') 
			return fail();
		
		parts = Buffer(parts[1], 'base64').toString('utf8').split(':', 2);
		req.authentication = parts;

		var user = parts[0];

		checkPassword(user, parts[1], function(err, status, principal) {
			if (err) return next(err);
			if (status) { req.authenticated = true; req.principal = principal || 'basic:'+user; }
			next();
		});
	}
}