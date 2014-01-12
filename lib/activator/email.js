

var mail = require('nodemailer');

module.exports = function(config) {
	var mailer, 
		subject = 'Activation' || config.subject,
		from = config.from;
	
	if (config.mailer)
		mailer = config.mailer;
	else
		mailer = mail.createTransport(config.type, config.settings);

	return function(req, res, next) {
		if (!req.token) return next('no token present');
	
		var 
			link = req.protocol + req.get('host') + req.path+'/verify/'+req.token,
			mail = {
				from: from,
				to: email,
				subject: subject,
				text: 'Go to '+link+' to verify your API key',
				html: 'Go to <a href="'+link+'">'+link+'</a> to verify your API key.'
			};

		mailer.sendMail(mail, next);
	}
}