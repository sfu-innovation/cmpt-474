
var WebSocket = require('ws'),
	async = require('async'),
	express = require('express'),
	app = express();


function hybi(req, socket, head, cb) {
	// handle premature socket errors
	var errorHandler = function() {
		try { socket.destroy(); } catch (e) {}
	}
	socket.on('error', errorHandler);

	// verify key presence
	if (!req.get('sec-websocket-key'))
		return next({ statusCode: 400, error: 'HYBI_NO_KEY' })

	// verify version
	var version = parseInt(req.get('sec-websocket-version'));
	if ([8, 13].indexOf(version) === -1)
		return next({ statusCode: 400, error: 'HYBI_INVALID_VERSION', version: version });

	// verify protocol
	var protocols = req.get('sec-websocket-protocol');

	// verify client
	var origin = version < 13 ? req.get('sec-websocket-origin') : req.get('origin');

	async.serial([
		function authorize(next) {
			var info = {
				origin: origin,
				secure: typeof req.connection.authorized !== 'undefined' || typeof req.connection.encrypted !== 'undefined',
				req: req
			};
		
			if (this.options.verifyClient.length == 2) {
				this.options.verifyClient(info, function(result) {
					if (!result) abortConnection(socket, 401, 'Unauthorized')
					else completeHybiUpgrade1();
				});
				return;
			}
			else if (!this.options.verifyClient(info)) {
				abortConnection(socket, 401, 'Unauthorized');
				return;
			}
		},
		function protocol(next) {
			// choose from the sub-protocols
			if (typeof self.options.handleProtocols == 'function') {
				var protList = (protocols || "").split(/, */);
				var callbackCalled = false;
				var res = self.options.handleProtocols(protList, function(result, protocol) {
					callbackCalled = true;
					if (!result) abortConnection(socket, 404, 'Unauthorized')
					else completeHybiUpgrade2(protocol);
				});
		
				if (!callbackCalled) {
					// the handleProtocols handler never called our callback
					abortConnection(socket, 501, 'Could not process protocols');
				}
				return;
			} 
			else {
				if (typeof protocols !== 'undefined') {
					completeHybiUpgrade2(protocols.split(/, */)[0]);
				}
				else {
					completeHybiUpgrade2();
				}
			}
		},
		function complete(next) {
			var headers = [
				'HTTP/1.1 101 Switching Protocols',
				'Connection: Upgrade',
				'Upgrade: websocket',
				'Sec-WebSocket-Accept: '+crypto.createHash('sha1')
					.update(req.get('sec-websocket-key') + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
					.digest('base64'),
			];
			
			if (typeof protocol != 'undefined') 
				headers.push('Sec-WebSocket-Protocol: '+protocol);

			socket.setTimeout(0);
			socket.setNoDelay(true);
			
			try {
				socket.write(headers.concat('', '').join('\r\n'));
			}
			catch (e) {
				// if the upgrade write fails, shut the connection down hard
				try { socket.destroy(); } catch (e) {}
				return;
			}

			var client = new WebSocket([req, socket, head], {
				protocolVersion: version,
				protocol: protocol
			});

			// signal upgrade complete
			socket.removeListener('error', errorHandler);
			next(undefined, client);
		}
	], next);
}



app.on('upgrade', function(req, socket, head) {
	hybi(req, socket, Buffer(head));
});

module.exports = app;
