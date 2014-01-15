
var cpr = require('cpr');

module.exports = function(path, url, callback) {
	cpr(url.path, path, {
		deleteFirst: true,
	    overwrite: true,
	    confirm: true
	}, callback);
}

module.exports.matches(/^file:$/)