#!/usr/bin/env node


var Manager = require('./manager'),
	Service = require('./service'),
	argv = require('optimist').argv,
	async = require('async'),
	path = require('path'),
	fs = require('fs'),
	UUID = require('com.izaakschroeder.uuid'),
	http = require('http'),
	express = require('express'),
	instanceId = argv['instance-id'],
	instanceKey = argv['instance-key'];
	dataPath = argv['data-path'],
	listen = argv['listen'];

var config = JSON.parse(fs.readFileSync(__dirname+'/../config.default.json'));


var providers = fs.readdirSync('./services').filter(function(entry) {
	return entry.match(/^[^.].*\.js$/);
}).map(function(entry) {
	var name = path.basename(entry, '.js')
	return new (require('./services/'+entry))(config.services[name]);
});



var manager = new Manager({
	providers: providers,
	path: config.path
});


var app = require('./routes')(manager);

var server = http.createServer(app);

//Reload the configuration and restart
//all now-active services.
process.on('SIGHUP', function() {
	manager.services.forEach(function(service) {
		service.configure();
	});
})

//Sent by platform to shutdown the instance.
process.on('SIGPWR', function() {
	//Shutdown the API
	server.close();
	//Shutdown all services
	manager.services.forEach(function(service) {
		service.stop();
	});

});



server.listen(4354);