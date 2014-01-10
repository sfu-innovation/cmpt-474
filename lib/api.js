
var ApiKey = require('./models/api-key');

module.exports = function(config) {

	var redis = config.store;

	function api(required) {
		if (typeof required === 'undefined') required = true;

		return function(req, res, next) {
			//Check to see if an X-API-Key header was provided and if it was
			//not
			if (!req.headers['x-api-key']) {
				//And we require one for the api call
				if (required) {
					//Then inform the caller
					res.status(401).send({ error: 'API_KEY_REQUIRED' });
					return;
				}
				//We don't require one and we don't got one so
				else {
					//We don't care
					next();
					return
				}
			}

			//Check the Content-Type and Accept headers for anything but
			//JSON and disallow them.
			if (!req.is('application/json'))
				return res.status(415).send({ error: 'INVALID_CONTENT_TYPE' });
			if (!req.accepts('application/json'))
				return res.status(406).send({ error: 'UNACCEPTABLE' });

			//Get information about the API key provided
			redis.get('/api-key/'+req.headers['x-api-key'], function(err, data) {
				if (err) return next(err);
				if (data)
					data = JSON.parse(data);
				//If it doesn't exist or is inactive, wait a second
				//and respond with invalid (to hopefully prevent people
				//from straight up brute-forcing keys).
				if (required && (!data || !data.active)) 
					return setTimeout(function() {
						res.status(401).send({ error: 'API_KEY_INVALID' })
					}, 1000);

				//Set the relevant properties on the requeset
				if (data) {
					req.apiKey = data; //req.headers['x-api-key'];
				}
				next();
			})

		}
	};

	

	//Rate-limiting so people can't abuse the server too much
	//by doing fun things like DoSing it (though I'm sure some
	//form of DoS is possible this maybe helps a little). Simply
	//enhancing your calm.
	function rateLimit(config) {
		
		config = config || { };
		
		var
			span = config.span || 15 * 60 * 1000 // 15 mins
			accuracy = config.accuracy || 10
			interval = span / accuracy,
			limit = config.limit || 10000;

		function read(key, callback) {
			var now = Date.now(), index = Math.floor((now % span) / interval)
			redis.pttl(key, function(err, ttl) {
				if (err) return callback(err);
				redis.hgetall(key, function(err, hash) {
					if (err) return callback(err);
					hash = hash || { };
					if (ttl < span) {
						for (var i = 0; i < accuracy; hash[i++] = '0') 
							if (hash[i]) 
								hash[i-accuracy] = hash[i];
						redis.hmset(key, hash)
						redis.pexpire(key, ttl < 0 ? 2 * span - (now % span) : ttl + span)
					}
					var count = 0
					for (var i = index - accuracy+ 1; i <= index; ++i) 
						if (hash[i]) 
							count += parseInt(hash[i])
					callback(err, count)
				})
			})
		}

		function increment(key, n, callback) {
			var now = Date.now(), index = Math.floor((now % span) / interval)
			read(key, function(err, count) {
				if (err) return callback(err);
				redis.hincrby(key, index, n, function(err) {
					if (err) return callback(err);
					callback(null, count + n)
				})
			})
		}

		return function(req, res, next) {

			//Ignore any non-API calls
			if (!req.apiKey) return next();

			increment('/api-key/'+req.apiKey.id+'/throttle', 1, function(err, count) {
				if (err) return res.status(500).send({ error: 'INTERNAL_ERROR' });
				if (count > limit) return res.status(429).send({ error: 'RATELIMIT_ERROR' });
				next();
			});

		}
	}

	return {
		authenticate: api,
		rateLimit: rateLimit
	}
};
