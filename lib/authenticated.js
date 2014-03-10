
module.exports = function(config) {
	
	if (typeof config === 'undefined') config = { required: true };
	if (typeof config === 'boolean') config = { required: config }
	
	var required = typeof config.required !== 'undefined' ? config.required : true;

	return function(req, res, next) {
		var delay = config.delay || req.app.get('authentication delay') || 1000;

		function fail() {
			return next({ statusCode: 401, data: req.authentication });
		}

		if (!req.authentication)
			if (required)
				return fail();
			else
				return next();
		
		if (!req.authenticated)
			if (delay > 0)
				return setTimeout(fail, delay);
			else
				return fail();
		
		next();
	}
}