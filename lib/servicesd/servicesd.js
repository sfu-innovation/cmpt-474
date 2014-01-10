#!/usr/bin/env node


var argv = require('optimist').argv,
	UUID = require('com.izaakschroeder.uuid'),
	url = require('url'),
	forever = require('forever-monitor'),
	instanceId = argv['instance-id'],
	instanceKey = argv['instance-key'];

function Service(config) {
	var id = config.id, 
		path = '/service/'+id;

	this.instance = forever.start(opts, {
		silent: true,
		max: 8,
		minUptime: 2000,
		spinSleepTime: 1000,
		killTree: true,
		spawnWith: {
			uid: 65534,
			gid: 65534
		}
	})

}

Service.prototype.restart = function() {
	this.instance.restart();
}

Service.prototype.stop = function() {
	this.instance.stop();
}



function start(opts) {

	//Propagate all the interesting stuff outside the sandbox
	service.on('error', function(err) {
		post(path+'/error', err);
	}).on('start', function() {
		post(path+'/start');
	}).on('stop', function() {
		post(path+'/stop');
	}).on('restart', function() {
		post(path+'/restart');
	}).on('exit', function() {
		post(path+'/exit');
	}).on('stdout', function(data) {
		post(path+'/stdout');
	}).on('stderr', function(data) {
		post(path+'/stderr');
	});
}

//services.push(new Service(config));


process.stdin.on('readable', function() {
	console.log('GOT A MESSAGE!')
	console.log(this.read().toString());
})

//Reload the configuration and restart
//all now-active services.
process.on('SIGHUP', function() {
	services.forEach(function(service) {
		service.restart();
	});
})

//Sent by LXC to shutdown the instance.
process.on('SIGPWR', function() {
	services.forEach(function(service) {
		service.stop();
	});
});

setInterval(function() {
	console.log('servicesd waiting');
}, 1000)

