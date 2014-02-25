
var byline = require('byline');

module.exports = function(done) {
	
	// TO-DO: On non-production environments, output
	// the errors to stderr. 
	function finalize(err) {
		if (err) process.exit(1);
		else process.exit(0);
	}

	var results = [ ];

	byline(process.stdin).on('readable', function() {
		var line;
		
		// Read a line from the input
		while (line = this.read()) {
			
			// Split it into its parts
			var parts = line.toString('utf8').split(' ', 3);
			// Note that we have another part to process
			
			results.push({ 
				from: parts[0], 
				to: parts[1], 
				ref: parts[2] 
			});
		}
	}).on('error', function(err) {
		done(err || true)
	}).on('end', function() {
		done(undefined, results);
	});
};
