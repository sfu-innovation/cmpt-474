
var fs = require('fs')
	mongoose = require('mongoose');

module.exports = function(source, db) {
	if (source instanceof mongoose.Mongoose === false) throw new TypeError();
	var path = __dirname;
	fs.readdirSync(path).forEach(function(name) {
		// FIXME: Don't hardcode index.js, use __filename
		if (!/\.js$/.test(name) || name == 'index.js') return;
		require(path+'/'+name)(source);
	});
	return source;
}