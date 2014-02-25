
var fs = require('fs');

module.exports = function(path) {
	var manifest = JSON.parse(fs.readFileSync(path+'/package.json')),
		branch = fs.readFileSync(path+'/.git/HEAD').toString('utf8').match(/ref:\s*refs\/heads\/(.*)/)[1],
		commit = fs.readFileSync(path+'/.git/refs/heads/'+branch);
	return {
		package: manifest.version,
		branch: branch,
		commit: commit,
		headers: function() { 
			return function(req, res, next) {
				res
					.set('X-App-Version', manifest.version)
					.set('X-App-Commit', commit)
					.set('X-App-Branch', branch);
				next();
			}
		}
	}
}
