
module.exports = function(types) {
	var types = Array.prototype.slice.apply(arguments);
	return function(req, res, next) {
		req.accept = req.accepts(types);
		if (!req.accept)
			return next({ statusCode: 406 });
		next();
	}
}

module.exports.on = function(type) {
	var types = Array.prototype.slice.apply(arguments);
	return function(req, res, next) {
		if (!req.accept) return next('no accept given.');
		for(var i = 0; i < types.length; ++i)
			if (typeof types[i].exec === 'function' && types[i].exec(req.accept))
				return next();
			else if (typeof types[i] === 'string' && types[i] === req.accept)
				return next();
		next('route');
	}
}