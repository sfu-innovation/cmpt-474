
var fs = require('fs'),
	url = require('url');

var search = __dirname + '/protocols';

var protocols = fs.readdirSync(search).filter(function(entry) {
	return entry.match(/^[^.].*\.js$/);
}).map(function(entry) {
	return require(search+'/'+entry);
});

module.exports = function(path, source, callback) {
	if (typeof source === 'string') source = url.parse(source);
	var choices = protocols.filter(function(protocol) {
		return protocol.matches.exec(source.protocol);
	});

	if (choices.length === 0) return callback('no handler');
	if (choices.length > 1) return callback('ambiguous handler');

	choices[0](path, source, callback);
}