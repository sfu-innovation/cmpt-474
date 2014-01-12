
module.exports = function(type) {
	return function(req, res, next) {
		if (!req.is(type))
			return res.send(415, { error: 'INVALID_CONTENT_TYPE' });
		next();
	}
}
