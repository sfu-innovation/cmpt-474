
var Schema = require('mongoose').Schema;

module.exports = function(app) {

	var mongoose = app.get('mongoose');

	var User =  Schema({
		
		// What the user prefers to be called; no reference
		// whatsoever to their actual legal name
		name: { type: String },

		// What authentication principles map to this user
		principles: { type: [String] }
	});

	mongoose.model('User', User);
}
