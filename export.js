
var async = require('async'),
	byline = require('byline'),
	fs = require('fs'), 
	app = require('./lib/app'),
	mongoose = app.get('mongoose');

var Assignment = mongoose.model('Assignment'),
	Submission = mongoose.model('Submission'),
	Evaluation = mongoose.model('Evaluation');

function next(err, r) {
	if (err) {
		console.log(err);
		process.exit(1);
	}
	Object.keys(r).sort().forEach(function(k) {
		console.log(k+':',r[k]);
	});
	process.exit(0);
}


var key = process.argv[2], finals = { }, waiting = 0;

Assignment.findOne({ key: key }).exec(function(err, assignment) {
	if (err) return next(err);
	if (!assignment) return next({error: 'NO_ASSIGNMENT'});
	byline(fs.createReadStream('groups.txt')).on('readable', function() {
		var line;
		while (line = this.read()) {
			var parts = /^([^:]+):\s*([^;]+)/.exec(line), 
				group = parts[1], 
				members = parts[2].split(',');
			
			++waiting;
			async.map(members, function(member, next) {
				Evaluation.find({ 
					assignment: assignment,
					target: 'cas:'+member
				}).exec(next);
			}, function(err, results) {
				var links = { };
				for (var i = 0; i < results.length; ++i)
					links[members[i]] = results[i];
				finals[group] = links;
				if (--waiting === 0) next(undefined, finals);			
			});
		}
	})

});
