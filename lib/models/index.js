
var fs = require('fs')
	mongoose = require('mongoose');

module.exports = function(db) {
	if (db instanceof mongoose.Connection === false) throw new TypeError();
	var models = { }, path = __dirname;
	fs.readdirSync(path).forEach(function(name) {
		if (!/\.js$/.test(name)) return;
		var m = require(path+'/'+name);
		for (var name in m) 
			models[name] = db.model(name, m[name])
	});
	return models;
}