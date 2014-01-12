
var fs = require('fs'), 
	path = require('path'),
	self = path.basename(__filename);

module.exports = fs.readdirSync(__dirname).filter(function(e) {
	return e !== self && e.match(/\.js$/);
}).map(function(e) {
	return fs.realpathSync(e);
});