// RFC 2616 (HTTP/1.1)
module.exports = function() {
	//Get list of methods that are allowed and sort them for
	//a consistent result in the Allow: HTTP header.
	var methods = Array.prototype.slice.call(arguments).sort();
	//Return the middleware
	return function(req, res, next) {
		//The method is not one of the allowed methods,
		if (methods.indexOf(req.method) === -1)
			//So set the Allow header to the list of allowed methods
			//and then end the request.
			return res.status(405).set('Allow', methods.join(', ')).end();
		//The method is allowed,
		else
			//So we don't care just continue on.
			return next();
	}
}