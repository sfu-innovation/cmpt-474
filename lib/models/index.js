
var fs = require('fs')
	mongoose = require('mongoose');

module.exports = function(app) {
	var path = __dirname;
	fs.readdirSync(path).forEach(function(name) {
		// FIXME: Don't hardcode index.js, use __filename
		if (!/\.js$/.test(name) || name == 'index.js') return;
		require(path+'/'+name)(app);
	});
	return app;
}