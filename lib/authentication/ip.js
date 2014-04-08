
var async = require('async'),
	dns = require('dns');

module.exports = function() {
	
	return function(allowed) {

		return function(req, res, next) {
			var ip;

			// Support for proxies
			if (req.get('X-Forwarded-For') && req.app.get('trust proxy'))
				ip = req.get('X-Forwarded-For');
			else
				ip = req.connection.remoteAddress;

			async.detect(allowed, function(name, check) {
				// FIXME: Better matching of IP addresses
				// FIXME: Support for IPv6 or other address families
				// If an IP is given just attempt direct match
				if (name === ip) return check(true);
				// Otherwise try to do DNS resolution
				dns.resolve(name, 'A', function(err, entries) {
					if (err) return check(false);
					else return check(entries.indexOf(ip) !== -1);
				})
			}, function(success) {
				if (!success) return next();
				req.authenticated = true; 
				req.principal = 'ip:'+ip;
				next();
			});
		}
	}
}
