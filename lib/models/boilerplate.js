
var Schema = require('mongoose').Schema;

module.exports = function(mongoose) {
	mongoose.model('Boilerplate', Schema({
		assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', unique: true, required: true },
		repository: { type: Schema.Types.ObjectId, ref: 'Repository', required: true }
	}));
}
