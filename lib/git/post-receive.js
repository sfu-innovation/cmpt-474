
module.exports = function(hook) {
	var data = '';
	process.stdin.on('readable', function(chunk) {
		var chunk;
		while (chunk = process.stdin.read())
			data += chunk.toString('utf8');
	}).on('end', function() {
		var parts = data.split(' ', 3);
		hook(parts[0], parts[1], parts[2]);
	});
};
