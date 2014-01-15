
function run(name, args, callback) {
	var process = spawn(name, args), stderr = '';
	process.stderr.on('readable', function(hunk) {
		stderr += hunk.toString('utf8');
	})
	process.on('error', function(err) {
		callback(err);
	}).on('exit', function(code) {
		callback(code !== 0 ? stderr : undefined);
	});
}

function Service(opts) {

}

Service.prototype.cache = function(callback) {
	var parts = url.parse(opts.files);
	if (parts.protocol.match(/https?/)) {
		http.get(opts.files, function(response) {
			if (response.statusCode !== 200)
				return callback('HTTP error '+response.statusCode)
			response.pipe(fs.createWriteStream('./some-path'))
				.on('error', function(err) {
					callback(err || true)
				})
				.on('end', function() {
					callback();
				});
		});
	}
	else if (parts.protocol.match(/git(\+(https?|ssh))?/)) {
		run('git', ['clone', url], callback)
	}
	else if (parts.protocol.match(/file/)) {
		return callback('file not yet supported');
	}
	else {
		return callback('unknown protocol '+parts.protocol);
	}
}

module.exports = Service;