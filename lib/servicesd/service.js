
var fs = require('fs'),
	mkdirp = require('mkdirp'),
	async = require('async'),
	path = require('path'),
	url = require('url'),
	child_process = require('child_process'),
	UUID = require('com.izaakschroeder.uuid'),
	Monitor = require('forever-monitor').Monitor,
	Proxy = require('./proxy'),
	EventEmitter = require('events').EventEmitter,
	util = require('util');



function Service(id, config) {
	EventEmitter.call(this);

	var service = this,
		path = dataPath+'/'+id,
		opts = [ ];

	console.log(config);

	this.id = id;
	this.state = 'unknown';
	this.type = new (types.index[config.type].type)(config.settings);

	this.path = config.path;

	this.monitor = new Monitor([this.program].concat(this.arguments), {
		silent: true,
		max: 8,
		minUptime: 2000,
		spinSleepTime: 1000,
		killTree: true,
		//spawnWith: {
		//	uid: 65534,
		//	gid: 65534
		//},
		outFile: 'stdout.log',
		errFile: 'stderr.log'
	});

	//this.proxy = new Proxy(servicePort);
	//this.proxy.listen(config.port);

	//Propagate all the interesting stuff outside the sandbox
	this.monitor.on('error', function(err) {
		service.emit('error');
	}).on('start', function() {
		service.state = 'started';
		service.emit('start')
	}).on('stop', function() {
		service.state = 'stopped';
		service.emit('stop');
	}).on('restart', function() {
		service.state = 'restarted';
		service.emit('restart');
	}).on('exit', function() {
		service.state = 'stopped';
		service.emit('exit')
	})
}
util.inherits(Service, EventEmitter);



Service.prototype.configure = function(callback) {
	var service = this;
	
	async.series([
		
		function directories(next) {
			async.forEach([
				'/logs', 
				'/pids', 
				'/work'
			].map(function(f) { return service.path+f; }), mkdirp, next);
		},
		
		function work(next) {
			var parts = url.parse(files);
			if (parts.protocol.match(/^https?:$/)) {
				http.get(opts.files, function(response) {
					if (response.statusCode !== 200)
						return callback('HTTP error '+response.statusCode)
					response.pipe(fs.createWriteStream(service.path+'/work'))
						.on('error', function(err) {
							callback(err || true)
						})
						.on('end', function() {
							callback();
						});
				});
			}
			else if (parts.protocol.match(/^git(\+(https?|ssh))?:$/)) {
				child_process.execFile('git', ['clone', url], { }, callback)
			}
			else if (parts.protocol.match(/^file:$/)) {
				return callback('file not yet supported');
			}
			else {
				return callback('unknown protocol '+parts.protocol);
			}
		}

	], function(err) {
		service.configured = !err;
		return callback(err);
	})
}

Service.prototype.information = function(callback) {
	callback(undefined, {
		id: this.id,
		configured: this.configured,
		state: this.state,
		type: this.type,
		listen: [
			{ address: 'xx', port: 44, proxied: true }
		]
	});
}

Service.prototype.start = function() {
	this.state = 'starting';
	this.monitor.start();
}

Service.prototype.restart = function() {
	this.state = 'restarting';
	this.monitor.restart();
}

Service.prototype.stop = function() {
	this.state = 'stopping';
	this.monitor.stop();
}


module.exports = Service;