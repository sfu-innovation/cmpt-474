

module.exports = function() {
		
	//Enforce 403 conditions
	return function(req, res, next) {

		//If there's no authorization data set at all then
		//just bail out entirely.
		if (typeof req.authorized !== 'boolean') 
			res.status(500).send({ error: 'INTERNAL_ERROR' });
		//If the requester is not authorized to make the request
		//then forbid them from doing anything.
		if (!req.authorized) 
			return res.status(403).send({ error: 'FORBIDDEN' });
		next();
	}
}


