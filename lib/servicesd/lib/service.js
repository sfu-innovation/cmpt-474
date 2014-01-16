
var EventEmitter = require('events').EventEmitter,
	util = require('util');


function Service(config) {
	EventEmitter.call(this);
	this.id = config.id;
	this.state = 'stopped';
	this.availability = 'unavailable';
}
util.inherits(Service, EventEmitter);

Object.defineProperty(Service.prototype, 'state', {
	get: function() {
		return this._state;
	},
	set: function(val) {
		this._state = val;
		this.emit('state', val);
		if (val === 'started')
			this.emit('start');
		else if (val === 'stopped')
			this.emit('stop');
	}
});

Object.defineProperty(Service.prototype, 'availability', {
	get: function() {
		return this._availability;
	},
	set: function(val) {
		this._availability = val;
		this.emit('availability', val);
	}
});

Service.prototype.clean = function(callback) {
	this._clean();
}



Service.prototype.information = function(callback) {
	var service = this;
	service._information(function(err, data) {
		if (err) return callback(err);
		else return callback(undefined, {
			id: service.id,
			state: service.state,
			availability: service.availability,
			data: data
		});
	});
}

Service.prototype.monitor = function(enable) {
	var service = this;
	
	if (typeof enable === 'undefined') enable = true;

	function up() {
		service.availability = 'unknown';
		service.monitor = service.monitor || setInterval(function() {
			service._heartbeat(function(err, result) {
				if (err) { 
					service.availability = 'unknown'; 
					service.emit('error', err);
					return;
				};
				service.availability = result ? 'available' : 'unavailable';
			})
		}, 5000);
	}
	
	function down() {
		service.availability = 'unknown';
		if (service.monitor)
			clearInterval(service.monitor)
		service.monitor = null;
	}

	function listen(state) {
		if (state === 'started')
			up();
		else 
			down();
	}
	
	if (enable) {
		if (service.state === 'started') 
			up();
		service.on('state', listen);
	}
	else {
		down();
		service.removeEventListener('state', listen);
	}
}

Service.prototype.setup = function(manager, callback) {
	this._setup(manager, callback);
}

Service.prototype.start = function(callback) {
	switch(this.state) {
	
	//Service is in a state which will lead
	//to the started state already so don't
	//bother doing anything.
	case 'started':
	case 'starting':
	case 'restarting':
		return callback && callback();
	
	//Service is in the process of shutting
	//down so... bring it back up after or not?
	case 'stopping':
		return callback && callback();
	
	//Service is stopped so start it up.
	case 'stopped':
	case 'ready':
		this.state = 'starting';
		this._start();
		return callback && callback();

	//Service is in an unknown state, so error out.
	default:
		return callback && callback();
	}
}

Service.prototype.restart = function(callback) {
	switch(this.state) {
	
	//Service is presently running so 
	//restart it.
	case 'started':
		this.state = 'restarting';
		this._restart();
		return callback && callback();
	
	//Service is not running, so start it
	//instead of restart it.
	case 'stopped':
	case 'ready':
		return this.start(callback);
	
	//Service is in the process of stopping
	//so ... boot it up again after or not?
	case 'stopping':
		return callback && callback();
	
	//Service is already restarting so don't
	//bother doing anything
	case 'restarting':
		return callback && callback();
	
	//Service in an unknown state so error out
	default:
		return callback && callback();
	}
}

Service.prototype.stop = function(callback) {
	switch(this.state) {

	//Service is running, so stop it.
	case 'started':
		this._stop();
		return callback && callback();
	
	//Service is in the process of starting up
	//so ... stop it after or not?
	case 'starting':
	case 'restarting':
		return callback && callback();

	//Service is not running, so don't bother
	//doing anything.
	case 'stopping':
	case 'stopped':
	case 'ready':
		return callback && callback();
	
	//Service is in an unknown state so error out.
	default:
		return callback && callback();
	}
}


module.exports = Service;