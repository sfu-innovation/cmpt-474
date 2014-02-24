
function Roles(client) {
	if (this instanceof Roles === false) return new Roles(client);
	if (!client) throw new TypeError();
	this.client = client;
	this.prefix = 'roles';
}

Roles.prototype.key = function(role) {
	return this.prefix+':'+role;
}

Roles.prototype.all = function(callback) {
	this.client.smembers(this.prefix, callback);
	return this;
}

Roles.prototype.contains = function(role, member, callback) {
	this.client.sismember(this.key(role), member, callback);
	return this;
}

Roles.prototype.get = function(role, callback) {
	this.client.smembers(this.key(role), callback);
	return this;
}

Roles.prototype.put = function(role, member, callback) {
	var roles = this;
	roles.client.sadd(this.prefix, role, function(err) {
		if (err) return callback(err);
		roles.client.sadd(roles.key(role), member, callback);
	});
	return this;
}

Roles.prototype.delete = function(role, member, callback) {
	this.client.srem(this.key(role), member, callback);
	return this;
}

Roles.prototype.for = function(member, callback) {
	var roles = this;
	this.all(function(err, roles) {
		async.filter(roles, function(role, next) {
			roles.contains(role, member, next);
		}, callback);
	});
	return this;
}

module.exports = Roles;
