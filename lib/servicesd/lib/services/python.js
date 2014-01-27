
var async = require('async'),
	Service = require('../service'),
	util = require('util');

function PythonService(service, settings) {
	Service.call(this, service);
	this.version = settings.version || 3;
	this.main = settings.main || '__main__.py';
	this.source = settings.source;
	this.path = null;
}
util.inherits(PythonService, Service);

PythonService.prototype._information = function(callback) {
	callback(undefined, {
		version: this.version,
		main: this.main,
		source: this.source
	});
}

PythonService.prototype._start = function() {
	this.process.start();
}

PythonService.prototype._restart = function() {
	this.process.restart();
}

PythonService.prototype._stop = function() {
	this.process.stop();
}

PythonService.prototype._setup = function(manager, callback) {
	var service = this;
	
	async.series([
		
		function location(next) {
			manager.directory(service, function(err, path) { 
				if (err) return next(err);
				service.path = path;
				next();
			});
		},
		
		function fetch(next) {
			manager.fetch(service, {
				destination: service.path+'/source', 
				source: service.source
			}, next);
		},
		
		function virtualenv(next) {
			//Pip is slightly mentally challenged and cannot for the
			//life of it install packages locally without attempting
			//to override some system properties, so virtualenv must
			//be used first in order to keep pip happy. Thug life.
			manager.run(service, 'virtualenv', [ '-p', 'python'+service.version, service.path ], { }, next);
		},
		
		function pip(next) {
			//As it turns out the shebang #! used in the virtualenv
			//alias cannot be longer than some terribly small amount
			//of characters and when you have UUIDs or other things
			//make your path long excve fails. Soooo we're avoiding
			//it all together by calling the binary manually.
			var args = [ service.path+'/bin/pip', 'install', '-r', 'requirements.txt'];
			manager.run(service, service.path+'/bin/python', args, {
				cwd: service.path+'/source'
			}, next);
		},
		
		function python(next) {
			var process = manager.process(
				service, 
				service.path+'/bin/python', 
				[ service.main ], 
				{
					cwd: service.path+'/source',
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

PythonService.prototype.heartbeat = function() {
	
}

function PythonProvider(config) {
	//consider how to use --download-cache
}
PythonProvider.key = "python";

PythonProvider.prototype.create = function(service, settings) {
	return new PythonService(service, settings);
}

module.exports = PythonProvider;
