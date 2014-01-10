var 
	crypto = require('crypto'),
	Model = require('../model'),
	validate = require('../validate');

module.exports = Model.create('api-key', [{
	name: 'id',
	validate: validate.length(56),
	default: function(callback) {
		crypto.randomBytes(128, function(err, data) {
			if (err) return callback(err);
			var hmac = crypto.createHmac('SHA224', '@#$RgDFG$TERDGFRe');
			hmac.update(data);
			key = hmac.digest('hex');
			return callback(undefined, key);
		});
	}}, { 
		name: 'email', 
		validate: validate.matches(/.*@.*/) 
	}, { 
		name: 'verified', 
		validate: validate.boolean(), 
		default: false 
	}, { 
		name: 'active', 
		validate: validate.boolean(), 
		default: false 
	}
]);
