

function Service(opts) {

}

Service.prototype.cache = function() {
	var parts = url.parse(opts.files);
	if (parts.protocol.match(/https?/)) {
		http.get(opts.files, function(response) {
			response.pipe(fs.createWriteStream('./some-path'));
		});
	}
	else if (parts.protocol.match(/git(\+(https?|ssh))?/)) {

	}
	else if (parts.protocol.match(/file/)) {

	}
}

module.exports = Service;