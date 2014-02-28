
var crypto = require('crypto'), Schema = require('mongoose').Schema;

module.exports = function(app) {

	var mongoose = app.get('mongoose');
	
	function generate(callback) {
		crypto.randomBytes(12, function(err, buf) {
			if (err) return callback(err);
			return callback(undefined, buf.toString('base64'));
		});
	}

	// Lol also key is not really secure... just something
	// "hard" to guess.
	var SecureKey = Schema({
		// FIXME: lol thanks Mongoose can't have defaults be async functions
		// and thus we can't assign required: true
		// The secure key.
		key: { type: String },
		context: { type: String, required: true },
		principal: { type: String, required: true }
	});

	SecureKey.index({ context: 1, principal: 1 }, { unique: true });

	SecureKey.pre('save', function(done) {
		console.log('magic')
		if (!this.key) this.generate(done);
		else done();
	});

	SecureKey.method('generate', function(done) {
		var secureKey = this;
		generate(function(err, key) {
			if (err) return done(err);
			secureKey.key = key;
			done();
		});
	});

	SecureKey.method('reset', function(done) {
		var secureKey = this;
		secureKey.generate(function(err) {
			if (err) return done(err);
			secureKey.save(done);
		})
	});

	SecureKey.static('open', function(context, principal, next) {
		var SecureKey = this, query = { principal: principal, context: context };
		SecureKey.findOne(query, function(err, key) {
			if (err) return next(err);
			if (!key) return SecureKey(query).save(function(err, model) {
				if (err && err.code === 11000) return SecureKey.findOne(query, function(err, model) {
					if (err) return next(err);
					if (!model) return next({ error: 'NO_KEY' });
					return next(undefined, model);
				});
				next(err, model); 
			});
			return next(undefined, key);
		});
	});

	mongoose.model('SecureKey', SecureKey);

}