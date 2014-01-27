
var Service = require('../service'),
	async = require('async'),
	util = require('util');

function NodeService(service, settings) {
	Service.call(this, service);
	this.source = settings.source;
	this.path = null;
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
			manager.directory(service, function(err, path) {
				if (err) return next(err);
				service.path = path;
				next();
			});
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
				cwd: service.path
			}, next)
		},
		function(next) {
			var process = manager.process(service, 'npm', ['start'], {
				cwd: service.path,
				env: {
					PORT: 2342,
					ADDRESS: '234.234.234.243'
				}
			});
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
