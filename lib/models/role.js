
var Schema = require('mongoose').Schema;

module.exports = function(app) {

	var mongoose = app.get('mongoose');
	
	var Role = Schema({
		members: { type: [ { type: Schema.Types.ObjectId, ref: 'User' } ] }
	});

	mongoose.model('Role', Role);
}
