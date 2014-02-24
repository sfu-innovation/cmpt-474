

module.exports = function() {
		
	//Enforce 403 conditions
	return function(req, res, next) {

		//If there's no authorization data set at all then
		//just bail out entirely.
		if (typeof req.authorized !== 'boolean') 
			return next({ statusCode: 500 });
		//If the requester is not authorized to make the request
		//then forbid them from doing anything.
		if (!req.authorized) 
			return next({ statusCode: 403 })
		next();
	}
}


