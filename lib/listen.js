//Some more advanced listening magic. Move this somewhere else for now.

	//Load up the appropriate modules for the possible
	//protocols we can use.
	var http = require('http'),
		https = require('https');

	(function listen(directive) {
		if (Array.isArray(directive))
			return directive.forEach(directive);
		switch (typeof directive) {
		case 'boolean':
			if (directive) return listen({});
			else return;
		case 'number':
			return listen({ port: directive });
		case 'string':
			return listen({ address: directive });
		case 'object':
			var port = 80, address = null, protocol = 'http';

			if (typeof directive.protocol !== 'undefined')
				protocol = directive.protocol;
			else if (directive.key && directive.cert)
				protocol = 'https';

			if (typeof directive.port !== 'undefined')
				port =  directive.port;

			if (typeof directive.address !== 'undefined')
				address = directive.address;

			switch(protocol) {
			case 'http':
				return http.createServer(app).listen(port, address);
			case 'https':
				return https.createServer({
					key: fs.readFileSync(directive.key), 
					cert: fs.readFileSync(directive.cert)
				}, app).listen(port, address);
			default:
				throw new TypeError('Invalid protocol: "'+protocol+'".');
			}
		default:
			throw new TypeError('Invalid listen directive.');
		}
	})(config.listen);