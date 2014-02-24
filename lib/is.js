
module.exports = function(type) {
	return function(req, res, next) {
		if (!req.is(type))
			return next({ statusCode: 415 });
		next();
	}
}
