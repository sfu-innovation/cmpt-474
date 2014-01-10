
var 
	express = require('express'),
	url = require('url'),
	fs = require('fs'),
    spawn = require('child_process').spawn;

function packet(data) {
	return (data.length + 0x10000 + 4).toString(16).substr(-4).toUpperCase() + data;
}

function flush() {
	return '0000';
}

function gitProcess(name, args, path) {
	var args = [name].concat(args).concat(path), p = spawn('git', args);
	//p.stderr.pipe(process.stderr);
	return p;
}


module.exports = function(path, repoHandler) {


	function rpcHandler(service, request, response, next) {
		
		var p = path(request), process = gitProcess(service, ['--stateless-rpc'], p);
		response.type('application/x-git-'+service+'-result');
		request.repositoryPath = p;
		request.pipe(process.stdin);
		process.stdout.pipe(response);
		process.on('exit', function(code) {
			if (code !== 0) return next('git error: '+code);
			response.end();
			next();
		})
	}

	function refsHandler(request, response, next) {
		var repositoryPath = path(request),
			service = url.parse(request.url, true).query.service;

		if (!service) {
			response.writeHead(400);
			response.end();
			return;
		}

		if (service.substr(0, 4) !== 'git-') {
			response.writeHead(400);
			response.end();
			return;
		}

		service = service.substr(4);

		fs.exists(repositoryPath+'/HEAD', function(exists) {
			if (!exists) {
				gitProcess('init', ['--bare', '--quiet'], repositoryPath).on('exit', function(code) {
					if (code !== 0) return next('git error '+code);
					proceed();
				});
			}
			else {
				proceed();
			}

		})

		function proceed() {
			
			var process = gitProcess(service, ['--stateless-rpc',  '--advertise-refs'], repositoryPath);
			response.type('application/x-git-'+service+'-advertisement');
			response.write(packet("# service=git-"+service+"\n"));
			response.write(flush());
			request.pipe(process.stdin);
			process.stdout.pipe(response);
			process.on('exit', function(code) {
				if (code !== 0) next('git error: '+code)
			});
		}
	}
	var app = express();

	app.post('/git-upload-pack', rpcHandler.bind(this, 'upload-pack'));
	app.post('/git-receive-pack', rpcHandler.bind(this, 'receive-pack'), repoHandler);
	app.get('/info/refs', refsHandler)
	app.get('/HEAD', function(res, req) {
		res.type('text/plain').sendfile(path(req)+'/HEAD');
	});
	app.get('/objects', function(req, res) {
		res.end();
	})
	return app;
};