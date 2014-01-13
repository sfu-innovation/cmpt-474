
var validate = require('./validate');

function Property(opts) {
	if (!opts.name) throw new TypeError()
	this.name = opts.name;
	this.default = opts.default;
	this.validate = opts.validate || validate.anything();
	this.index = opts.index || false;
	this.unique = opts.unique;
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
	var propertyIndex = this.propertyIndex = { };
	this.properties.forEach(function(property) {
		if (typeof propertyIndex[property.name] !== 'undefined')
			throw new TypeError('Duplicate property: '+property.name);
		propertyIndex[property.name] = property;
	})
}

Model.prototype.validator = function(props) {
	var properties = this.properties;

	if (props)
		properties = properties.filter(function(p) {
			return props.indexOf(p.name) !== -1;
		})

	var validator = validate.all(properties.map(function(p) {
		return validate.property(p.name, p.validate)
	}));

	return function(input, context, callback) {
		validator(input, context, function(err, result, output) {
			if (err) return callback(err);
			if (!result) return callback(undefined, result, output);
			var out = { };
			output.forEach(function(val, i) {
				out[properties[i].name] = val;
			})
			callback(undefined, result, out);
		})
	}

}

Model.prototype.getProperty = function(name) {
	return this.propertyIndex[name];
}

Model.create = function(name, properties) {
	return new Model(name, properties);
}


module.exports = Model;