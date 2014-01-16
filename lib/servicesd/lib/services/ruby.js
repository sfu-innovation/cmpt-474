
var Service = require('../service'),
	util = require('util');

function RubyService(service, settings) {
	Service.call(this, service);
	this.source = settings.source;
	this.path = settings.path;
}
util.inherits(RubyService, Service);

RubyService.prototype._information = function(callback) {
	callback({
		source: this.source
	})
}

RubyService.prototype._setup = function(manager, callback) {
	var service = this;
	async.series([
		function(next) {
			manager.directory(service, service.path, next);
		},
		function(next) {
			manager.fetch(service, {
				destination: this.path, 
				source: this.source
			}, next);
		},
		function(next) {
			var args = ['install', '--deployment'];
			manager.run(service, 'bundle', args, {
				cwd: config.path
			}, next);
		},
		function() {

		}
	], callback);	
}

RubyService.prototype._start = function(manager) {
	this.monitor.start();
}

RubyService.prototype._restart = function(manager) {

}

RubyService.prototype._stop = function(manager) {

}


function RubyProvider() {

}
RubyProvider.key = "ruby";

RubyProvider.prototype.create = function(config) {
	return new RubyService(config);
}

module.exports = RubyProvider;