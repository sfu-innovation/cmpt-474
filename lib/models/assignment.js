
var Schema = require('mongoose').Schema, 
	tree = require('mongoose-tree');

module.exports = function(app) {
	var mongoose = app.get('mongoose');
	
	mongoose.model('Assignment', Schema({
		key: { type: String, required: true },
		title: { type: String, required: true },
		icon: { type: String },
		blurb: { type: String },
		description: { type: String },
		start: { type: Date, default: Date.now() },
		end: { type: Date },
		enabled: { type: Boolean, default: true }
	}).plugin(tree));

	/*
	mongoose.model('AssignmentRepository', Schema({
		assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
		repository: { type: Schema.Types.ObjectId, ref: 'Repository', required: true }
	}));
	*/
}
