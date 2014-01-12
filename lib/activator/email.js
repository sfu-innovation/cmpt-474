
function() {
	var 
		link = 'https://' + req.host + req.path+'/verify/'+nonce,
		mail = {
			from: "no-reply <no-reply@sfu.ca>",
			to: email,
			subject: 'Activate API Key',
			text: 'Go to '+link+' to verify your API key',
			html: 'Go to <a href="'+link+'">'+link+'</a> to verify your API key.'
		};

	mailer.sendMail(mail, callback)
}


