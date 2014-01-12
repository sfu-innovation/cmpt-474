
function NodeService(config) {
	this.config = config;
}
NodeService.name = 'nodejs';

NodeService.prototype.heartbeat = function() {
	
}

module.exports = NodeService;
