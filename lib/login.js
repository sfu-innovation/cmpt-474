


function login(principal, req, res, next) {
	req.session.principal = principal;
	entity(principal, function(err, entity) {
		if (err) return next(err);
		req.session.entity = entity;
		res.redirect('/');
	});
}

app.get('/logout', session.deauthenticate(), redirect('/'))


app.use('/login/cas', require('./cas')());
app.use('/login/cas', function(req, res, next) {
	login('cas:'+req.casId, req, res, next);
	
});

app.use('/login/facebook', require('./facebook')(appId, appSecret, ['email']));
app.use('/login/facebook', session.authenticate())


app.use('/login/facebook', function(req, res, next) {
	req.facebook.verify(function(err, result) {
		if (err) return next(err);
		login('facebook:'+result.user_id, req, res, next);
		//TODO: import name/photo/etc.
		/*req.facebook.query(result.user_id, ['id', 'name', 'email', 'languages', 'picture.type(square)'], function(err, data) {
			if (err) next(err);
			console.log(data);
		})*/
	});
});

module.exports = app;