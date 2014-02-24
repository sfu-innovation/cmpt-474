
module.exports = function(change) {

	return function(req, res, next) {
		req.url = change;
		next();
	}
}