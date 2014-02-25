
var crypto = require('crypto'), Schema = require('mongoose').Schema;

module.exports = function(mongoose) {

	function generate(callback) {
		crypto.randomBytes(12, function(err, buf) {
			if (err) return callback(err);
			return callback(undefined, buf.toString('base64'));
		});
	}

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

	mongoose.model('SecureKey', SecureKey);

}