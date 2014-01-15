
function RubyService() {
	
}

function RubyProvider() {

}

RubyProvider.prototype.create = function(config) {
	return new RubyService(config);
}

module.exports = RubyProvider;