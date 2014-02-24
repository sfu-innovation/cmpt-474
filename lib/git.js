

function packet(data) {
	return (data.length + 0x10000 + 4).toString(16).substr(-4).toUpperCase() + data;
}

function flush() {
	return "0000";
}

function head() {
	return function(req, res, next) {
		if (!req.repository) return next({ error: 'NO_REPOSITORY' });
		req.repository.head(function(err, head) { 
			if (err) return next(err);
			res.type('text/plain').send(200, head); 
		});
	}
}

function rpcHandler(opts) {
	
	var service = opts.service || function(req, next) { 
		var service = req.query.service;
		return next(undefined, service.substr(4)); 
	};

	if (typeof service === 'string') service = (function(s) { return function(req, next) { return next(undefined, s); }})(service);
	if (typeof service !== 'function') throw new TypeError();

	return function() {
		return function(req, res, next) {
			if (!req.repository) return next({ error: 'NO_REPOSITORY' });
			service(req, function(err, service) {
				if (err) return next(err);
				var stream = req.repository.rpc(service, { stateless: true, advertise: opts.type === 'advertisement' });
				req.pipe(stream).once('readable', function() {
					res.status(200).type('application/x-git-'+service+'-'+opts.type);
					if (opts.type === 'advertisement') {
						res.write(packet("# service=git-"+service+"\n"));
						res.write(flush());
					}
				}).pipe(res);
			});			
		}
	}
}

module.exports = {
	uploadPack: rpcHandler({ service: 'upload-pack', type: 'result' }),
	receivePack: rpcHandler({ service: 'receive-pack', type: 'result'}),
	refs: rpcHandler({ type: 'advertisement' }),
	head: head
};

