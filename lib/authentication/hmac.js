
var crypto = require('crypto'), basic = require('./basic');

module.exports = function authenticate(opts) {

	var secret = opts.secret, realm = opts.realm;

	function generatePassword(username) {
		return crypto
			.createHmac('SHA256', secret)
			.update(username)
			.digest('base64');
	}

	function checkPassword(username, password) {
		return generatePassword(username) === password;
	}

	var authenticate = basic(function(user, password, next) {
		next(undefined, checkPassword(user, password), 'hmac:'+user);
	});

	authenticate.generatePassword = generatePassword;
	authenticate.checkPassword = checkPassword;

	return authenticate;
}