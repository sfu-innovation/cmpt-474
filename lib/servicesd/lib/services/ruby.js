
var Service = require('../service'),
	util = require('util');

function RubyService(config) {
	Service.call(this);
}
util.inherits(RubyService, Service);

RubyService.prototype.setup = function(config, callback) {
	
	async.series([
		function(next) {
			manager.fetch({
				destination: path, 
				source: config.source
			}, next);
		},
		function(next) {
			var args = ['install', '--deployment'];
			manager.run('bundle', args, {
				cwd: config.path
			}, next);
		}
	], callback);	
}

RubyService.prototype.start = function() {
	manager.spawn(this.binary);
}

RubyService.prototype.stop = function() {

}


function RubyProvider() {

}
RubyProvider.name = "ruby";

RubyProvider.prototype.create = function(config) {
	return new RubyService(config);
}

module.exports = RubyProvider;