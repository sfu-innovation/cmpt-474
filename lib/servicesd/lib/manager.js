
var UUID = require('com.izaakschroeder.uuid'),
	mkdirp = require('mkdirp'),
	fs = require('fs'),
	Service = require('./service'),
	Monitor = require('forever-monitor').Monitor,
	child_process = require('child_process'),
	fetcher = require('./fetcher');

function Manager(config) {
	this.services = [ ];
	this.services.index = { };
	this.providers = config.providers.slice();
	this.path = config.path;
	this.providers.index = { };
	this.providers.forEach(function(provider, i, providers) {
		providers.index[provider.constructor.key] = provider;
	});
	this.resources = {
		directories: [ ],
		processes: [ ],
		fetches: [ ]
	}
	console.log(this.providers.index)
}

Manager.prototype.directory = function(service, callback) {
	if (service instanceof Service === false) throw new TypeError();
	var self = this,
		path = this.path+'/'+service.id+'/'+UUID.generate();
	mkdirp(path, function(err) {
		if (err) return callback(err);
		return fs.realpath(path, function(err, path) {
			if (err) return callback(err);
			self.resources.directories.push({ 
				path: path, 
				owner: service 
			});
			return callback(undefined, path);
		});
	});
}

Manager.prototype.process = function(service, name, args, opts) {
	if (service instanceof Service === false) throw new TypeError();
	opts = opts || { };
	var monitor = new Monitor([name].concat(args || [ ]), {
		silent: true,
		max: 8,
		killTTL: 6000,
		minUptime: 2000,
		spinSleepTime: 1000,
		killTree: true,
		spawnWith:  {

		},
		cwd: opts.cwd,
		env: opts.env
	});

	monitor.on('stdout', function(data) {
		console.log(''+data);
	}).on('stderr', function(data) {
		console.log(''+data);
	})

	return monitor;
}

Manager.prototype.run = function(service, name, args, opts, callback) {
	if (service instanceof Service === false) throw new TypeError();
	child_process.execFile(name, args, opts, function(err, stdout, stderr) {
		console.log(stdout + stderr);
		callback(err);
	});
}

Manager.prototype.fetch = function(service, options, callback) {
	if (service instanceof Service === false) throw new TypeError();
	fetcher(options.destination, options.source, callback);
}

Manager.prototype.connection = function(service, opts, callback) {
	if (service instanceof Service === false) throw new TypeError();

	return callback(undefined, { port: 6666, address: '127.0.0.1' });

	var proxy = new Proxy(servicePort);
	

	service.on('start', function() {
		proxy.listen(config.port);
	}).on('stop', function() {
		proxy.close();
	});
}


Manager.prototype.service = function(type, service, settings) {
	if (arguments.length === 1) { 
		var id = arguments[0], item = this.services.index[id];
		return item ? item.service : null;
	}
	if (!this.providers.index[type]) throw new Error(type);
	return this.providers.index[type].create(service, settings);
}

Manager.prototype.get = function(id) {
	
}

Manager.prototype.put = function(id, config, callback) {
	var exists = typeof this.services.index[id] !== 'undefined';
	var service = this.service(config.type, { id: id }, config.settings);
	if (exists)
		this.del(config.id);
	this.services.index[service.id] = { 
		service: service, 
		offset: this.services.length 
	};
	this.services.push(service);
	callback(undefined, service);
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


module.exports = Manager;
