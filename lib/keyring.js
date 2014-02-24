
var crypto = require('crypto');

function Keyring(client, prefix) {
	if (this instanceof Keyring === false) return new Keyring(client, prefix);
	this.prefix = prefix || 'keyring:';
	this.client = client;
}

Keyring.prototype.generate = function(callback) {
	crypto.randomBytes(16, function(err, buf) {
		if (err) return callback(err);
		return callback(undefined, buf.toString('base64'));
	});
	return this;
}

Keyring.prototype.delete = function(id, callback) {
	this.client.del(this.prefix+id, callback);
	return this;
}

Keyring.prototype.put = function(id, data, callback) {
	var keyring = this;
	this.generate(function(err, key) {
		if (err) return callback(err);
		keyring.client.hmset(keyring.prefix+id, { key: key, data: data }, function(err) {
			if (err) return callback(err);
			return callback(undefined, key);
		});
	});
	return this;
}

Keyring.prototype.open = function(id, key, callback) {
	this.get(id, function(err, result) {
		if (err) return callback(err);
		if (key !== result.key) return callback(undefined, false);
		return callback(undefined, true, result.data);
	});
	return this;
}

Keyring.prototype.key = function(id, data, callback) {
	var keyring = this;
	keyring.get(id, function(err, result) {
		if (err) return callback(err);
		if (!result) return keyring.put(id, data, callback);
		return callback(undefined, result.key);
	});
	return this;
}

Keyring.prototype.get = function(id, callback) {
	var keyring = this;
	keyring.client.hgetall(keyring.prefix+id, callback);
	return this;
}

module.exports = Keyring;