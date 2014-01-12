
module.exports = function(config) {
	config = config || { };
	var required = typeof config.required !== 'undefined' ? config.required : true;

	return function(req, res, next) {
		var delay = config.delay || req.app.get('authentication delay') || 1000;

		if (!req.authentication)
			if (required)
				return res.send(401, { error: 'NOT_AUTHENTICATED' });
			else
				return next();
		if (!req.authenticated)
			if (delay > 0)
				return setTimeout(function() {
					res.send(401, { error: 'AUTHENTICATION_INVALID' });
				}, delay);
			else
				return res.send(401, { error: 'AUTHENTICATION_INVALID' });
		next();
	}
}