
var 
	secureToken = require('com.izaakschroeder.secure-token');

module.exports = function(config) {

	var expiry = config.expiry || 60*60*24*7,
		redis = config.store,
		token = secureToken(config.token);


	function create(data) {

		return function(req, res, next) {
			//Store that nonce in the database along with
			//some information about what it corresponds to
			//and set the key to expire at some point in the
			//future so people can't suddenly pick up someone
			//else's activation
			secureToken(function(err, nonce) {
				if (err) return next(err);
				var key = '/verify/'+nonce;
				redis.set(key, JSON.stringify(data), function(err) {
					if (err) return next(err);
					redis.expire(key, expiry, function(err) {
						if (err) return next(err);
						req.token = nonce;
						next();
					});
				});				
			})

		}
			
			
		
	}

	function verify(param) {
		param = param || 'nonce';
		
		return function(req, res, next) {
			var nonce = req.params[param], key = '/verify/'+nonce;
			redis.get(key, function(err, data) {
				if (err) return next(err);
				if (!data) return setTimeout(function() {
					res.send(400, { error: 'INVALID_NONCE' })
				}, 1000);
				res.verification = data;
				next();
			})
		}
	}

	return {
		create: create,
		verify: verify
	};
}