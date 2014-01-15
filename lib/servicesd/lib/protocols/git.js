
var fs = require('fs'),
	child_process = require('child_process');

module.exports = function(path, url, callback) {
	var branch = url.hash || 'master', 
		parts = path.split('+', 2),
		protocol = parts[1] || parts[0];

	fs.exists(path+'/.git', function(exists) {
		async.series([
			function(next) {
				var args = [exists ? 'pull' : 'clone', url.host+url.path, path];
				child_process.execFile('git', args, { }, next);
			},
			function(next) {
				var args = ['checkout', branch];
				child_process.execFile('git', args, { }, next);
			}
		], callback);
	});
}

module.exports.matches = /^git(\+(https?|ssh))?:$/
