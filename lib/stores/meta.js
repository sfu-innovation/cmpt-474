
function Meta(config) {
	this.targets = config.targets;
}

Meta.prototype.dispatch = function(method, entity, model, callback) {
	var choices = this.targets.filter(function(target) {
		return true;
	});

	function use(i) {
		if (i >= choices.length) return callback(undefined, false);
		choices[i][method](entity, model, function(err, result) {
			if (err) return callback(err);
			if (!result) return use(i+1);
			return callback(undefined, result);
		});
	}

	use(0);
}

Meta.prototype.get = function(entity, model, callback) {
	return this.dispatch('get', entity, model, callback);
}

Meta.prototype.put = function(entity, callback) {
	return this.dispatch('put', entity, model, callback);
}

Meta.prototype.delete = function(entity, callback) {
	return this.dispatch('delete', entity, model, callback);
}

module.exports = Meta;