
var fs = require('fs'),
	path = require('path'),
	base = __dirname,
	evaluators = { };

fs.readdirSync(base).forEach(function(name) {
	if (!/\.js$/.test(name)) return;
	evaluators[path.basename(name, '.js')] = require(base+'/'+name);
});

module.exports = evaluators;