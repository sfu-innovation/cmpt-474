
var net = require('net'),
	async = require('async');

function drop() {
	var empty = new Buffer();
	return function(item, context, callback) {
		callback(undefined, empty);
	}
}

function delay(amount) {
	return function(item, context, callback) {
		setTimeout(function() {
			callback(undefined, item);
		}, amount);
	}
}

function item(matches, execute) {
	return { matches: matches, execute: execute };
}

function handle(source, destination) {
	var actions = [ ], context = null;

	source
	//There is data available for reading in
	//the incoming stream
	.on('readable', function() {
		//Loop through all the possible actions
		async.reduce(actions, this.read(), function(data, action, next) {
			//Check to see if the action is applicable
			action.matches({ 
				data: data, 
				source: source, 
				destination: destination 
			}, context, function(err, result) {
				//If there was an error in checking then bail
				if (err) return next(err);
				//If the action isn't applicable then continue
				if (!result) return next(undefined, data);
				//The action is applicable, so apply it
				action.execute(data, context, next);
			});
		}, function(err, data) {
			if (err) return;
			destination.write(data);
		})
		
	})
	//The incoming stream is preparing to close
	//its connection
	.on('end', function() {
		destination.end();
	})
	//The incoming stream has shutdown its connection;
	//this event happens after an error as well.
	.on('close', function() {
		destination.destroy();
	})
	//The incoming stream has suffered some kind of
	//connection error
	.on('error', function(err) {
		console.log('error: '+err);
	});

	return actions;
}

function Proxy(port, host) {
	this.server = net.createServer(function(socket) {
		var proxy = net.connect(port, host);
		var forward = handle(socket, proxy),
			reverse = handle(proxy, socket);
		forward.push(item(validate.anything(), delay(1000)));
	});
}

Proxy.prototype.listen = function(port, host, callback) {
	this.server.listen(port, host, callback);
}

module.exports = Proxy;