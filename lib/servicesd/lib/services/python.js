
var child_process = require('child_process'),
	Service = require('../service'),
	util = require('util');

function PythonService(config) {
	Service.call(this);
	this.version = config.version || 3;
	this.main = '__init__.py';
}
util.inherits(PythonService, Service);

PythonService.prototype.program = function() {
	return {
		binary: 'python' + this.version,
		arguments: [ '-E', this.main ]
	}
}

PythonService.prototype.setup = function(config, callback) {
	async.series([
		function(next) {
			manager.fetch({
				destination: path, 
				source: config,source
			}, next);
		},
		function(next) {
			manager.run('pip', ['install', '-r', 'requirements.txt'], {
				cwd: config.path
			}, next);
		}
	], callback);
}

PythonService.prototype.heartbeat = function() {
	
}

function PythonProvider(config) {

}
PythonProvider.name = "python";

PythonProvider.prototype.create = function(config) {
	return new PythonService();
}

module.exports = PythonProvider;
