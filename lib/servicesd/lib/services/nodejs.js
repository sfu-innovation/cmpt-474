
var Service = require('../service'),
	util = require('util');

function NodeService(config) {
	Service.call(this);
	this.config = config;
}
util.inherits(NodeService, Service);

NodeService.prototype.heartbeat = function() {
	
}

NodeService.prototype.start = function() {
	
}

NodeService.prototype.stop = function() {

}

NodeService.prototype.setup = function(config, callback) {
	async.series([
		function(next) {
			manager.fetch({
				destination: path, 
				source: config.source
			}, next);
		},
		function(next) {
			var args = ['install', '--deployment'];
			manager.run('npm', args, {
				cwd: config.path
			}, next)
		}
	], callback);
	
}

function NodeProvider(config) {

}
NodeProvider.name = "nodejs";

NodeProvider.prototype.create = function(config) {
	return new NodeService();
}

module.exports = NodeProvider;
