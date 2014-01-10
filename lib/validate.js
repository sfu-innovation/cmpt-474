

function all(config) {
		
		//Typechecks
		if (!Array.isArray(config)) throw new TypeError();
		config.forEach(function(entry) {
			if (typeof entry !== 'function') throw new TypeError();
		});
		
		return function(input, context, callback) {	
			function process(i, value) {
				if (i >= config.length) return callback(undefined, true, value);
				config[i](input, context, function(err, result, value) {
					if (err) return callback(err);
					if (!result) return callback(undefined, false, value);
					else return process(i+1, value);
				}) ;
			}

			process(0, input);
		};
	};

function property(name, validator) {
	if (typeof name !== 'string') throw new TypeError();
	if (typeof validator !== 'function') throw new TypeError();

	return function(input, context, callback) {
		if (typeof input !== 'object') 
			return callback(undefined, false, { error: 'NO_SUCH_PROPERTY', property: name });
		else
			return validator(input[name], context, function(err, result, value) {
				if (err) return callback(err);
				if (!result) return callback(undefined, false, { error: 'INVALID_PROPERTY', property: name, details: value });
				return callback(undefined, true, value);
			});
	}
}

function number() {
	return function(input, context, callback) {
		if (typeof input === 'number') 
			return callback(undefined, true, input);
		if (typeof input === 'string')
			if (!input.match(/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/)) 
				return callback(undefined, false, 'INVALID_NUMBER');
			else 
				return callback(undefined, true, Number(input))
		return callback(undefined, false, 'INVALID_NUMBER');
	}
}

function boolean() {
	return function(input, context, callback) {
		if (typeof input === 'boolean')
			return callback(undefined, true, input);
		if (typeof input === 'string')
			if (input === 'true')
				return callback(undefined, true, true);
			else if (input === 'false')
				return callback(undefined, true, false);
		return callback(undefined, false, 'INVALID_BOOLEAN');
	}
}

function exists(redis, key) {
	return function(input, context, callback) {
		redis.exists(key+input, function(err, result) {
			return callback(err, result);
		})
	}
}

function matches(pattern) {
	if (pattern instanceof RegExp === false) throw new TypeError();
	return function(input, context, callback) {
		if (typeof input !== 'string') return callback(undefined, false, 'INVALID_STRING');
		if (!input.match(pattern)) return callback(undefined, false, 'INVALID_STRING');
		return callback(undefined, true, input);
	}
}

function atMostLength(amount) {
	if (typeof amount !== 'number') throw new TypeError();
	return function(input, context, callback) {
		if (typeof input !== 'string') return callback(undefined, false, 'INVALID_STRING');
		if (input.length > amount) return callback(undefined, false, 'STRING_TOO_LONG');
		return callback(undefined, true, input);
	}
}

function atLeastLength(amount) {
	if (typeof amount !== 'number') throw new TypeError();
	return function(input, context, callback) {
		if (typeof input !== 'string') return callback(undefined, false, 'INVALID_STRING');
		if (input.length < amount) return callback(undefined, false, 'STRING_TOO_SHORT');
		return callback(undefined, true, input);
	}
}

function length(amount) {
	if (typeof amount !== 'number') throw new TypeError();
	return function(input, context, callback) {
		if (typeof input !== 'string') return callback(undefined, false, 'INVALID_STRING');
		if (input.length !== amount) return callback(undefined, false, { type: 'INVALID_LENGTH', expected: amount, got: input.length });
		return callback(undefined, true, input);
	}
}

function refersTo(type) {
	return function(input, context, callback) {
		return callback(undefined, false, 'INVALID_ENTITY');
	}
}

function every(each) {
	if (typeof each !== 'function') throw new TypeError();
	return function(input, context, callback) {
		if (!Array.isArray(input)) return callback(undefined, false, 'NOT_SET');
		var out = [ ], success = true;
		function check(i) {
			if (i >= input.length) return callback(undefined, success, out);
			each(input[i], context, function(err, result, data) {
				out[i] = data;
				if (!result)
					success = false;
				check(i+1)
			})
		}
		check(0);
	}
}

function anything() {
	return function(input, context, callback) {
		callback(undefined, true, input);
	}
}

function validate(validator) {
	return function(req, res, next) {
		validator(req.body, req, function(err, result, value) {
			if (err) return res.status(500).send({ error: 'INTERNAL_ERROR' });
			if (!result) return res.status(400).send({ error: 'INVALID_REQUEST', details: value });
			next();
		})
	}
}



module.exports = {
	validate: validate,
	anything: anything,
	boolean: boolean,
	number: number,
	exists: exists,
	all: all,
	property: property,
	matches: matches,
	atLeastLength: atLeastLength,
	atMostLength: atMostLength,
	length: length,
	every: every
};