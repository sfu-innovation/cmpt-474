
var ApiKey = require('./models/api-key');

function authenticate() {

	return function(req, res, next) {
		
		var redis = req.app.get('store'),
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
		redis.get('/api-key/'+apiKey, function(err, data) {
			if (err) 
				return next(err);
			
			if (data)
				data = JSON.parse(data);
			
			//If it doesn't exist or is inactive, don't mark the
			//request as authenticated
			if (data && data.active) {
				//Set the relevant properties on the requeset
				req.authenticated = true;
				req.principal = data; //req.headers['x-api-key'];
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

	return function(req, res, next) {

		var redis = req.app.get('store');

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

		//Ignore any non-API calls
		if (!req.apiKey) return next();

		increment('/api-key/'+req.apiKey.id+'/throttle', 1, function(err, count) {
			if (err) return next(err);
			if (count > limit) return res.send(429, { error: 'RATELIMIT_ERROR' });
			next();
		});

	}
}

function content() {
	return function(req, res, next) {
		//Check the Content-Type and Accept headers for anything but
		//JSON and disallow them.
		if (!req.is('application/json'))
			return res.send(415, { error: 'INVALID_CONTENT_TYPE' });
		if (!req.accepts('application/json'))
			return res.send(406, { error: 'UNACCEPTABLE' });
		next();
	}
}

module.exports = {
	authenticate: authenticate,
	rateLimit: rateLimit,
	content: content
}

