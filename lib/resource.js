
var express = require('express'),
	async = require('async'),
	validate = require('./validate');



module.exports = function(model) {
	
	function parse(props) {
	
		
		return function(req, res, next) {
			var obj = { };

			async.map(model.properties, function(item, callback) {
				
				function done(err, value) { 
					callback(err, { property: item, value: value })
				}
				
				//If all properties are selected or the current
				//property is one of the ones we wish to include
				if (!props || props.indexOf(item.name) !== -1)
					//Fetch its data from the request
					item.getValue(req.body, done);
				//Otherwise
				else
					//Just use the default value
					item.getDefaultValue(done)
			}, function(err, result) {
				if (err) return next(err);
				result.forEach(function(item) {
					obj[item.property.name] = item.value;
				});
				req.object = obj;
				next();
			});
		}
	}

	function claim() {
		return function(req, res, next) {
			if (!req.principal) return next('no principal for ownership');
			if (!req.object) return next('no object to take ownership of');
			req.object.owner = req.principal;
			next();
		}
	}

	function validateR(props) {

		var validator = model.validator(props);

		return function(req, res, next) {
			validator(req.object, req, function(err, result, value) {
				if (err) return next(err);
				if (!result) return res.send(400, { error: 'INVALID_REQUEST', details: value });
				return next();
			});
		}
	}

	function put() {
		return function(req, res, next) {
			var entry = this, store = req.app.get('store');
			if (!req.object) return next('no object with request');
			store.put(model, req.object, function(err, result, created) {
				if (err) return next(err);
				//FIXME: Somehow get the mount path and inject it
				//into this?
				res.set('Location', '/'+req.object.id);
				res.send(created ? 201 : 200, req.object);
			})
		}
	}

	function load(param, props) {
		param = param || 'id';
		return function(req, res, next) {
			var store = req.app.get('store'), search = { };
			search[param] = req.params[param];
			store.get(model, search, function(err, result) {
				if (err) return next(err);
				if (result.length === 0) return res.send(404, { error: 'NOT_FOUND' });
				if (result.length > 1) return next('too many results')
				req.object = result[0];
				return next();
			})
		}
	}

	function get() {
		return function(req, res) {
			if (!req.object) return next('no object with request');
			res.send(200, req.object);
		}
	}

	function del(param) {
		param = param || 'id';
		return function(req, res, next) {
			var store = req.app.get('store');
			store.delete(model, req.params[param], function(err, result) {
				if (err) return next(err);
				if (!result) return res.send(404, { error: 'NOT_FOUND' });
				res.status(204)
			})
		}
	}

	function show() {
		return function(req, res, next) {
			if (!req.object) return next('no resource to show');
			res.send(200, req.object);
		}
	}

	function list() {
		return function(req, res, next) {
			next();
		}
	}

	return {
		parse: parse,
		validate: validateR,
		get: get,
		put: put,
		delete: del,
		del: del,
		show: show,
		load: load,
		list: list,
		claim: claim
	}
};