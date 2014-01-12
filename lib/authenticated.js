
module.exports = function(config) {
	config = config || { };
	var delay = config.delay || 1000;

	return function(req, res, next) {
		if (!req.authentication)
			return res.send(401, { error: 'NOT_AUTHENTICATED' });
		if (!req.authenticated)
			if (delay)
				return setTimeout(function() {
					res.send(401, { error: 'AUTHENTICATION_INVALID' });
				}, 1000);
			else
				return res.send(401, { error: 'AUTHENTICATION_INVALID' });
		next();
	}
}