
var 
	https = require('https'),
	querystring = require('querystring'),
	UUID = require('com.izaakschroeder.uuid');

function request(method, host, path, done) {
	https.request({
		host: host,
		method: method,
		path: path
	}, function(out) {
		var data = '';
		out.on('readable', function() {
			data += this.read();
		}).on('error', function(err) {
			done(err || true);
		}).on('end', function() {
			if (out.statusCode < 200 || out.statusCode >= 300)
				done(data);
			else
				done(undefined, data);
		})
	}).on('error', function(err) {
		done(err || true);
	}).end();
}


function Facebook(appId, appSecret, token) {
	this.appId = appId;
	this.appSecret = appSecret;
	this.token = token;
}

Facebook.prototype.query = function(object, properties, callback) {
	request('GET', 'graph.facebook.com', '/'+object+'?'+querystring.stringify({
		fields: properties.join(','),
		access_token: this.token
	}), function(err, data) {
		if (err) return callback(err);
		callback(undefined, JSON.parse(data));
	})
}

Facebook.prototype.verify = function(callback) {
	var appId = this.appId;
	request('GET', 'graph.facebook.com', '/debug_token?' + querystring.stringify({
		input_token: this.token,
		access_token: this.appId+'|'+this.appSecret
	}), function(err, data) {
		if (err) return callback(err);
		var token = JSON.parse(data);
		if (!token) return callback('invalid response');
		if (''+token.data.app_id !== appId) return callback('mismatched token');
		if (!token.data.is_valid) return callback('invalid token');
		return callback(undefined, token.data);
	});
}

module.exports = function(appId, appSecret, scope) {
	var nonces = { };
	return function(req, res, next) {

		console.log('HANDLING FACEBOK');

		var nonce = req.query.state, url = req.protocol + '://' + req.headers['host'] + req._parsedUrl.pathname ;

		var redirect = (function() {
			nonce = UUID.generate();

			nonces[nonce] = setTimeout((function(nonce) {
				delete nonces[nonce];
			}), 1000*3600)

			res.redirect(302, "https://www.facebook.com/dialog/oauth?" + querystring.stringify({
				client_id: appId,
				redirect_uri: url,
				state: nonce,
				response_type: 'code',
				scope: scope.join(',')
			}));
		})

		if (!nonce || typeof nonces[nonce] === "undefined") 
			return redirect();
		
		clearTimeout(nonces[nonce]);
		delete nonces[nonce];
		
		if (req.query.code) {
			request('GET', 'graph.facebook.com', '/oauth/access_token?' + querystring.stringify({
				client_id: appId,
				redirect_uri: url,
				client_secret: appSecret,
				code: req.query.code
			}), function(err, data) {
				if (err) return next(err);
				var result = querystring.parse(data);
				if (!result) return next({ error: 'RESPONSE_INVALID' });
				req.facebook = new Facebook(appId, appSecret, result.access_token)
				req.facebook.verify(function(err, result) {
					if (err) return next(err);
					req.principal = 'facebook:'+result.user_id;
					req.authenicated = true;
					req.authenication = req.query.code;
					next();
				});
			})
		}
		else {
			next({ error: 'NO_CODE', message: parts.query.error});
		}
		
	}
}