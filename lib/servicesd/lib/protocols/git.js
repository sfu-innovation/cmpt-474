
var fs = require('fs'),
	child_process = require('child_process'),
	async = require('async');

module.exports = function(path, url, callback) {
	var branch = url.hash || 'master', 
		parts = url.protocol.split('+', 2),
		protocol = parts[1] || parts[0];

	fs.exists(path+'/.git', function(exists) {
		async.series([
			function(next) {
				var remote = (protocol !== 'file:' ? (protocol + '//' + url.host) : '')+url.path;
				if (exists)
					child_process.execFile('git', ['pull', remote], { cwd: path }, next);
				else
					child_process.execFile('git', ['clone', remote, path], next);
			},
			function(next) {
				child_process.execFile('git', ['checkout', branch], { cwd: path }, next);
			}
		], callback);
	});
}

module.exports.matches = /^git(\+(https?|ssh|file))?:$/
