


var ldap = require('ldapjs'),
	util = require('util');

module.exports = function(opts) {
	
	return function(dn) {
		return basic(function(username, password, next) {
			// Create new LDAP client
			var client = ldap.createClient(opts);
			// Attempt to bind with the appropriate credentials
			client.bind(util.format(dn, username), password, function(err) {
				// Disconnect
				client.unbind();
				// If the error isn't authentication failure then bail
				if (err && err.code !== 49) return next(err);
				// Authenticate
				next(undefined, !err, 'ldap:'+username);	
			});
		});
	}	
}