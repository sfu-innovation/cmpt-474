
module.exports = function(types) {
	var types = Array.prototype.slice.apply(arguments);
	return function(req, res, next) {
		req.accept = req.accepts(types);
		if (!req.accept)
			return res.send(406, { error: 'UNACCEPTABLE' });
		next();
	}
}

module.exports.on = function(type) {
	var types = Array.prototype.slice.apply(arguments);
	return function(req, res, next) {
		if (!req.accept) return next('no accept given.');
		next(types.indexOf(req.accept) === -1 ? 'route' : undefined);
	}
}