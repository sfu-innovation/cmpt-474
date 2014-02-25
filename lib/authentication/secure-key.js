
var basic = require('./basic');

module.exports = function(SecureKey) {
	return function(context) {
		return basic(function(user, password, next) {
			SecureKey.findOne({ context: context, key: password }, function(err, key) {
				if (err || !key) return next(err, false);
				return next(undefined, true, key.principal);
			});
		});
	}	
}