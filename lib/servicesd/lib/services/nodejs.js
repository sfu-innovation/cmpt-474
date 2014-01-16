
var Service = require('../service'),
	async = require('async'),
	util = require('util');

function NodeService(service, settings) {
	Service.call(this, service);
	this.source = settings.source;
	this.path = settings.path;
}
util.inherits(NodeService, Service);

NodeService.prototype._heartbeat = function() {
	
}

NodeService.prototype._information = function(callback) {
	callback(undefined, {
		source: this.source
	});
}

NodeService.prototype._clean = function(manager) {
	async.series([
		function files(next) {
			rimraf(this.path, next);
		}
	], callback);
}

NodeService.prototype._start = function(manager) {
	this.process.start();
}

NodeService.prototype._restart = function() {
	this.process.restart();
}

NodeService.prototype._stop = function(manager) {
	this.process.stop();
}

NodeService.prototype._setup = function(manager, callback) {
	var service = this;
	async.series([
		function(next) {
			manager.directory(service, service.path, next);
		},
		function(next) {
			manager.fetch(service, {
				destination: service.path, 
				source: service.source
			}, next);
		},
		function(next) {
			var args = ['install', '--deployment'];
			manager.run(service, 'npm', args, {
				cwd: config.path
			}, next)
		},
		function(next) {
			var process = manager.process(service, 'npm', ['start']);
			process.on('error', function(err) {
				service.emit('error');
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
		},
		function(next) {
			service.state = 'ready';
		}
	], callback);
	
}

function NodeProvider(config) {

}
NodeProvider.key = "nodejs";

NodeProvider.prototype.create = function(service, settings) {
	return new NodeService(service, settings);
}

module.exports = NodeProvider;
