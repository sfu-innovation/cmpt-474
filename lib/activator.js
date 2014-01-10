
var 
	express = require('express')
	secureToken = require('com.izaakschroeder.secure-token'),
	async = require('async');

module.exports = function(config) {

	var expiry = config.expiry || 60*60*24*7,
		redis = config.store,
		token = secureToken(config.token),
		methods = config.methods,
		app = express();

	var methods = {
		email: function() {
			var 
				link = 'https://' + req.host + req.path+'/verify/'+nonce,
				mail = {
					from: "no-reply <no-reply@sfu.ca>",
					to: email,
					subject: 'Activate API Key',
					text: 'Go to '+link+' to verify your API key',
					html: 'Go to <a href="'+link+'">'+link+'</a> to verify your API key.'
				};

			mailer.sendMail(mail, callback)
		}
	}

	app.get('/verify/:target', function(req, res, next) {

	})

	app.request = function(data) {

	}

	function send(data, callback) {
	
		async.waterfall([
			//Create some hard to guess nonce
			token,
			//Store that nonce in the database along with
			//some information about what it corresponds to
			//and set the key to expire at some point in the
			//future so people can't suddenly pick up someone
			//else's activation
			function store(nonce, callback) {
				var key = '/verify/'+nonce;
				redis.set(key, JSON.stringify(data), function(err) {
					if (err) return callback(err);
					redis.expire(key, expiry, function(err) {
						if (err) return callback(err);
						callback(undefined, nonce);
					});
				});
			},
			
			function send(nonce, callback) {
				async
			}
		], callback);
			
		
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
		send: send,
		verify: verify
	};
}