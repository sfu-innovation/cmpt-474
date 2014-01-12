
module.exports = function(type) {
	return function(req, res, next) {
		if (!req.accepts('application/json'))
			return res.send(406, { error: 'UNACCEPTABLE' });
		next();
	}
}