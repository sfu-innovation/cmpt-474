
var Service = require('./service');

function Manager(config) {
	this.services = [ ];
	this.services.index = { };
	this.providers = config.providers.slice();
	this.path = config.path;
	this.providers.index = { };
	this.providers.forEach(function(provider, i, providers) {
		providers.index[provider.name] = provider;
	});
}

Manager.prototype.run = function(name, args, opts, callback) {

}

Manager.prototype.fetch = function(options) {

}

Manager.prototype.connection = function(opts) {

}


Manager.prototype.service = function(type, settings) {
	if (!this.providers.index[type]) throw new TypeError();
	return this.providers.index[type].create(settings);
}

Manager.prototype.get = function(id) {
	return services.index[id] ? services.index[id].service : null;
}

Manager.prototype.put = function(id, config) {
	var exists = typeof this.services.index[id] !== 'undefined';
	var service = new Service(this, {
		id: id,
		path: this.path+'/'+id,
		service: this.service(config.type, config.settings)
	})
	if (exists)
		this.del(config.id);
	this.services.index[service.id] = { service: service, offset: services.length };
	this.services.push(service);
}

Manager.prototype.del = function(id) {
	if (id instanceof Service) id = id.id;
	if (typeof this.services.index[id] === 'undefined') 
		throw new TypeError();
	var offset = this.services.index[id].offset;
	this.services.index[id].stop();
	this.services.splice(offset, 1);
	delete this.services.index[id];
}

Manager.prototype.setup = function(service) {
	if (service instanceof Service === false)
		throw new TypeError();


}

module.exports = Manager;