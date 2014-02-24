
module.exports = function authenticate(opts) {

	return function(req, res, next) {
		if (!req.session) 
			return next();
		if (req.session.authenticated) {
			req.authenticated = true;
			req.principal = req.session.principal;
		}
		next();
	}
}

module.exports.authenticate = function() {
	return function(req, res, next) {
		if (!req.principal) return next({ statusCode: 500 });
		if (!req.session) return next({statusCode: 500 });
		req.session.principal = req.principal;
		req.session.authenticated = true;
		next()
	}
}

module.exports.deauthenticate = function() {
	return function(req, res, next) {
		if (!req.session) return next();
		req.session.principal = undefined;
		req.session.authenticated = false;
		next();
	}
}