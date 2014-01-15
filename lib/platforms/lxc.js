
var LXC = require('com.izaakschroeder.lxc');


function IPv4Address(value, mask) {
	if (this instanceof IPv4Address === false) 
		return IPv4Address.normalize(value);
	this._value = value >>> 0;
	this._mask = typeof mask !== 'undefined' ? mask : 32;
	this.family = 'IPv4';
}

Object.defineProperty(IPv4Address.prototype, 'value', {
	get: function() {
		return this._value;
	}
})

Object.defineProperty(IPv4Address.prototype, 'start', {
	get: function() {
		return this._value;
	}
})

Object.defineProperty(IPv4Address.prototype, 'end', {
	get: function() {
		return (this._value | (Math.pow(2,32 - this._mask)-1)) >>> 0;
	}
})



Object.defineProperty(IPv4Address.prototype, 'mask', {
	get: function() {
		return new IPv4Address(this.end, 32);
	}
})

IPv4Address.normalize = function(addr) {
	if (typeof addr === 'string') addr = IPv4Address.fromString(addr);
	if (typeof addr === 'number') addr = new IPv4Address(addr, 32);
	if (addr instanceof IPv4Address === false) throw new TypeError();
	return addr;
}

IPv4Address.fromString = function(value) {
	var parts = value.split('/');
	var d = parts[0].split('.');
	return new IPv4Address(((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]),parts[1] || 0);
}

IPv4Address.prototype.equals = function(addr) {
	addr = IPv4Address.normalize(addr);
	return addr._value === this._value && addr._mask === this._mask;
}

IPv4Address.prototype.contains = function(addr) {
	addr = IPv4Address.normalize(addr);
	return addr.value >= this.start && addr.value <= this.end;
}

IPv4Address.prototype.toString = function(mask) {
	var parts = [
			((this._value >> 24) & 255),
			((this._value >> 16) & 255),
			((this._value >> 8) & 255),
			this._value & 255
		];
    return (parts.join('.')) + (mask ? '/'+this._mask : '');
}

IPv4Address.prototype.generate = function() {
	var 
		mask = Math.pow(2,32 - this._mask)-1,
		start = this.start, 
		end = this.end;
	return new IPv4Address(Math.floor(Math.random() * (end - start + 1)) + start, 32);
}

function LXCPlatform(config) {
	this.network = config.network;
	this.lxc = new LXC(config.path);
	this.limits = config.limits;
	this.addresses = { };
	this.instances = [ ];
	this.instances.index = { };
}

LXCPlatform.prototype.allocateAddress = function() {
	while (needed) {
		var address = this.network.pool.generate();
		if (this.network.reserved.some(function(reserved) { return address.equals(reserved); }))
			continue;
		if (this.addresses[address.toString()])
			continue;
	}
	this.addresses[address.toString()] = true;
	return address;
}

LXCPlatform.prototype.freeAddress = function(address) {
	delete this.addresses[address.toString()];
}

LXCPlatform.prototype.getInstances = function(callback) {
	return this.instances;
}

LXCPlatform.prototype.get = function(id, callback) {
	return callback(undefined, this.instances.index[id])
}



LXCPlatform.prototype.del = function(id, callback) {

}

LXCPlatform.prototype.start = function(id, callback) {
	var instance = this.instances.index[id];
	if (!instance) return callback('no such instance '+id);
	instance.start(callback);
}

LXCPlatform.prototype.stop = function(id, callback) {
	var instance = this.instances.index[id];
	if (!instance) return callback('no such instance '+id);
	instance.stop(callback);
}

LXCPlatform.prototype.freeze = function(id, callback) {
	var instance = this.instances.index[id];
	if (!instance) return callback('no such instance '+id);
	instance.freeze(callback);
}

LXCPlatform.prototype.thaw = function(id, callback) {
	var instance = this.instances.index[id];
	if (!instance) return callback('no such instance '+id);
	instance.thaw(callback);
}


LXCPlatform.prototype.put = function(instance, callback) {

	var id = instance.id;

	if (typeof this.instances.index[id] !== 'undefined') {
		return callback('cannot yet update instances')
	}

	var container = this.lxc.container('cloud-'+id),
		address = this.network.pool.generate(),
		mask = this.network.pool.mask,
		device = this.network.device,
		instance = new Instance({
			container: container,
			id: id,
			services: opts.services,
			network: [{
				device: device,
				addresses: [
					{ family: 'IPv4', value: address, mask: mask }
				]
			}],
			limits: this.limits,
			storage: this.storage+'/'+id
		});

	
	this.instances.push(instance);
	this.instances.index[id] = instance;
	return callback();
	

}

function Instance(opts) {
	this.id = opts.id;
	this.container = opts.container;
	this.services = opts.services;
	this.network = opts.network;
	this.limits = opts.limits;
	this.storage = opts.storage;
}


Instance.prototype.setup = function(callback) {
	var 
		instance = this, 
		storage = this.storage;
	

	var config = LXC.Configuration({
		'lxc.utsname': instance.id,
		'lxc.rootfs': storage + '/root',
		//This has to be an array because instead of offering any kind
		//of grouping or naming in config files, multiple networks are
		//separated by type: veth/etc. commands.
		'lxc.network': instance.network.map(function(network, i) {
			return [
				{ key: 'type', value: network.type || 'veth' },
				{ key: 'flags', value: 'up' },
				{ key: 'link', value: network.device },
				{ key: 'name', value: 'vnet'+i }
			].concat(network.addresses.reduce(function(result, address) {
				var family = address.family.toLowerCase();
				return result.concat([
					{ key: family, value: address.value+' '+address.mask },
					{ key: family+'.gateway', value: 'auto' }
				])
			}, []))
		}),
		//The most braindead configuration flag in the entire system
		//is this peice of shit. Not only does it not work, the
		//documentation is totally useless about it.
		'lxc.autodev': 0, 
		//Look at this nice consistency between mount configs; one
		//uses one line with multiple entries, the other uses multiple
		//lines with one entry!
		'lxc.mount.auto': 'proc sys',
		'lxc.mount.entry': [
			//This sweet ass magic will save us from the fact that
			//LXC doesn't know how to autodev.
			'none /dev devtmpfs defaults 0 0',
			//The rest are just the usual suspects.
			'/lib lib none ro,bind 0 0',
			'/bin bin none ro,bind 0 0',
			'/usr usr none ro,bind 0 0',
			'/sbin sbin none ro,bind 0 0',
			'/lib64 lib64 none ro,bind 0 0',
			'/lib32 lib32 none ro,bind 0 0'
		],
		'lxc.kmsg': 0,
		//More Ubuntu brilliance! Can't drop sys_admin capability
		//with the default LXC install! Need to add PPA to get
		//bleeding edge LXC. Equally as fucking brilliant is there
		//is no way to drop all caps. Either drop individual ones
		//or keep individual ones. We need setuid/setgid to drop
		//child processes into nobody land.
		'lxc.cap.keep': 'setuid setgid chown',
		'lxc.cgroup.devices.deny': 'a',
		'lxc.cgroup.devices.allow': [
			'c 1:3 rwm', //# dev/null
			'c 1:5 rwm', //# dev/zero
			'c 5:1 rwm', //# dev/console
			'c 5:0 rwm', //# dev/tty
			'c 4:0 rwm', //# dev/tty0
			'c 4:1 rwm', //# dev/tty0
			'c 1:9 rwm', //# dev/urandom
			'c 1:8 rwm', //# dev/random
			'c 136:* rwm', // # dev/pts/*
			'c 5:2 rwm', // dev/pts/ptmx
		],
		//At least this shit makes sense and works
		'lxc.cgroup.cpu.shares': instance.limits.cpu,
		'lxc.cgroup.memory.limit_in_bytes': instance.limits.memory,
		'lxc.pts': 1,
		'lxc.tty': 1,
		'lxc.console': storage + '/console'
	});


	async.series([

		function skeleton(callback) {
			var path = config.getValue('lxc.rootfs');
			
			async.series([
				function directories(next) {
					async.forEach([
						'/bin', 
						'/dev', 
						'/dev/pts', 
						'/etc', 
						'/lib', 
						'/lib32', 
						'/lib64', 
						'/proc', 
						'/sbin', 
						'/sys', 
						'/opt',
						'/usr', 
						'/var'
					].map(function(f) { return path+f; }), mkdirp, next);
				},
				function core(next) {
					//localPrefix
					npm.load({ localPrefix: path+'/opt' }, function (err, npm) {
						if (err) return next(err);
						npm.prefix = path+'/opt';
						npm.commands.install([__dirname+'/../lib/servicesd'], next)
					});
				}
			], callback);
		},
		//Boot servicesd for running the rest of the
		//desired programs
		function boot(callback) {
			instance.container.on('process', function(c) {
				c.stderr.pipe(process.stderr);
				c.stdout.pipe(process.stdout);
				c.stdin.write('Hello\n');
			})
			instance.container.execute(config, '/opt/node_modules/.bin/servicesd', [
				'--instance-id', instance.id,
				'--instance-key', instance.key
			]);
		}
	], callback);
}

Instance.prototype.start = function(callback) {
	//Call servicesd to launch each of the services
	async.forEach(this.services, function(service, callback) {
		service.start(callback)
	}, callback);
}

Instance.prototype.stop = function(callback) {
	//Call servicesd to stop each of the services
	async.forEach(this.services, function(service, callback) {
		service.stop(callback)
	}, function(err) {
		if (err) return callback(err);
	});
}

module.exports = LXCPlatform;