// RFC 2616 (HTTP/1.1)
module.exports = function() {
	//Get list of methods that are allowed and sort them for
	//a consistent result in the Allow: HTTP header.
	var methods = Array.prototype.slice.call(arguments).sort(),
		text = methods.join(', ');
	//Return the middleware
	return function(req, res, next) {
		//Set the Allow header to the list of allowed methods
		res.set('Allow', text);
		//The method is not one of the allowed methods,
		if (methods.indexOf(req.method) === -1)
			//End the request with the error.
			return next({ statusCode: 405 });
		//The method is allowed,
		else
			//So we don't care just continue on.
			return next();
	}
}