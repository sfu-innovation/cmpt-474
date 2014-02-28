#!/usr/bin/env node


var app = require('./lib/app');
require('http').createServer(app).listen(process.env['PORT'] || 8798); //, 'localhost'

