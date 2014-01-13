
var ApiKey = require('./models/api-key');

function authenticate() {

	return function(req, res, next) {
		
		var store = req.app.get('store'),
			apiKey = req.get('x-api-key');

		//Check to see if an X-API-Key header was provided and if it was
		//not
		if (!apiKey) {
			req.authentication = false;
			return next();
		}

		req.authentication = {
			type: 'api-key',
			value: apiKey
		};


		//Get information about the API key provided
		store.get(ApiKey, { token: apiKey }, function(err, results) {
			if (err) return next(err);
			
			//If it doesn't exist or is inactive, don't mark the
			//request as authenticated
			if (results.length > 0 && results[0].active) {
				//Set the relevant properties on the requeset
				req.authenticated = true;
				req.principal = results[0].principal;
			}
			
			next();
		})

	}
};



module.exports = {
	authenticate: authenticate
}

