
var fs = require('fs'),
	http = require('http'),
	https = require('https'),
	rimraf = require('rimraf'),
	unzip = require('unzip');

//check HEAD E-Tag, Last-Modified-Since
//if they match, then return cached data
//otherwise download new data

module.exports = function(path, url, callback) {

	async.series([
		function(next) {
			rimraf(path, next)
		},
		function(next) {
			fs.mkdir(path, next)
		},
		function(next) {
			var engine = url.protocol === 'https:' ? https : http;
			engine.get(url, function(response) {
				if (response.statusCode !== 200)
					return next('HTTP error '+response.statusCode)
				response.pipe(unzip.Extract({ path: path }))
					.on('error', function(err) {
						callback(err || true)
					})
					.on('end', function() {
						callback();
					});
			});
		}
	])
}

module.exports.matches = /^https?:$/
