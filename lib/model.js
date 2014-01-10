
var validate = require('./validate');

function Property(opts) {
	this.name = opts.name;
	this.default = opts.default;
	this.validate = opts.validate;
}

Property.prototype.getValue = function(object, callback) {
	if (typeof object[this.name] !== 'undefined')
		return callback(undefined, object[this.name]);
	else
		return this.getDefaultValue(callback);
}

Property.prototype.getDefaultValue = function(callback) {
	if (typeof this.default === 'function') {
		if (this.default.length > 0) return this.default(callback)
		var val;
		try {
			val = this.default();
		}
		catch (E) {
			return callback(E);
		}
		return callback(undefined, val);
	}
	else {
		callback(undefined, this.default);
	}
}

function Model(name, properties) {
	this.name = name;
	this.properties = properties.map(function(e) {
		if (e instanceof Property) return e;
		else return new Property(e);
	});
	
}

Model.create = function(name, properties) {
	return new Model(name, properties);
}


module.exports = Model;