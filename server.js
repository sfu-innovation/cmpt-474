#!/usr/bin/env node


var app = require('./lib/app');
var app = require('./lib/app');
require('http').createServer(app).on('connection', function(socket) {
	socket.setTimeout(0); //Crafty
}).listen(process.env['PORT'] || 8798); //, 'localhost'
