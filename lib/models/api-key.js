
var Schema = require('mongoose').Schema;

module.exports = function(app) {
	
	var mongoose = app.get('mongoose');

	mongoose.model('APIKey', Schema({

	}));
}
