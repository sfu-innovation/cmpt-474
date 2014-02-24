
module.exports = function(keyring) {
	return function(prefix) {
		prefix = prefix || '';
		return basic(function(user, password, next) {
			keyring.open(prefix+user, password, next);
		});
	}	
}