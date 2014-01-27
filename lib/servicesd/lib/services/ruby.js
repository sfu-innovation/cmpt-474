
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
		function(next) {
			var process = manager.process(
				service, 
				'ruby', 
				[ service.main ], 
				{
					cwd: service.path,
					env: {
						PORT: 2342,
						ADDRESS: '127.0.0.1'
					}
				}
			);
			process.on('error', function(err) {
				service.emit('error', err);
			}).on('start', function() {
				service.state = 'started';
			}).on('stop', function() {
				service.state = 'stopped';
			}).on('restart', function() {
				service.state = 'started';
			}).on('exit', function() {
				service.state = 'stopped';
			});
			service.process = process;
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