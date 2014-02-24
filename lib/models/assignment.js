
var Schema = require('mongoose').Schema, tree = require('mongoose-tree');

module.exports = {
	'Assignment': Schema({
		key: { type: String, required: true },
		title: { type: String, required: true },
		icon: { type: String },
		blurb: { type: String },
		description: { type: String },
		start: { type: Date, default: Date.now() },
		end: { type: Date }
	}).plugin(tree)
}
