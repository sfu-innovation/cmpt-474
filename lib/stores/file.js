
var mkdirp = require('mkdirp'),
	path = require('path'),
	fs = require('fs');

function File(config) {
	config = config || { };
	this.path = config.path || './run/data';
}

File.prototype.path = function(entity) {
	return this.path + '/' + entity.type + '/' + entity.id + '.json';
}

File.prototype.prepare = function(p, callback) {
	var dir = path.dirname(p);
	fs.exists(dir, function(e) {
		if (e) return callback(undefined, p);
		return mkdirp(dir, function(err) {
			if (err) return callback(err);
			return callback(undefined, p)
		});
	});
}

File.prototype.put = function(entity, model, callback) {
	var path = this.path(entity);
	this.prepare(path, function(err, path) {
		if (err) return callback(err);
		fs.writeFile(path, JSON.stringify(entity), callback);
	});
}

File.prototype.get = function(entity, model, callback) {
	var path = this.path(entity);
	fs.exists(path, function(exists) {
		if (!exists) return callback();
		fs.readFile(path, function(err, data) {
			if (err) return callback(err);
			var obj;
			try {
				obj = JSON.parse(data);
			}
			catch (E) {
				return callback(E);
			}
			callback(undefined, obj);
		})
	})
}

File.prototype.delete = function(entity, model, callback) {
	fs.exists(path, function(exists) {
		if (!exists) return callback(undefined, false);
		fs.unlink(path, function(err) {
			callback(err, !err);
		});
	});
}

module.exports = File;