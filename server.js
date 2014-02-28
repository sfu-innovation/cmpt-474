#!/usr/bin/env node

// FIXME: Is there a more elegant way?
// If we're being called as node server.js or if we're being run under pm2 
// then create the server and listen on the appropriate addresses/ports.
var app = require('./lib/app');
require('http').createServer(app).listen(8798); //, 'localhost'

