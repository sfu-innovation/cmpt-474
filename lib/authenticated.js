
module.exports = function(config) {
	
	if (typeof config === 'undefined') config = { required: true };
	if (typeof config === 'boolean') config = { required: config }
	
	var required = typeof config.required !== 'undefined' ? config.required : true;

	return function(req, res, next) {
		var delay = config.delay || req.app.get('authentication delay') || 1000;

		if (!req.authentication)
			if (required)
				return next({ statusCode: 401 });
			else
				return next();
		
		if (!req.authenticated)
			if (delay > 0)
				return setTimeout(function() {
					return next({ statusCode: 401, data: req.authentication });
				}, delay);
			else
				return next({ statusCode: 401, data: req.authentication });
		
		next();
	}
}