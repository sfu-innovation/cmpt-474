
function error(verbose) {
	
	return function(err, req, res, next) {
		
		var types = [
			'application/json', 
			'application/xml+xhtml', 
			'text/html', 
			'text/plain'
		];

		var code = err.statusCode || 500;

		console.log('HTTP',code,req.path,err);
		if (err.stack) console.log(err.stack.toString());

		switch(req.accepts(types)) {
		case 'application/json':
			return res.send(code, verbose ? err : { error: 'INTERNAL_ERROR' });
		case 'application/xml+xhtml':
		case 'text/html':
			return res.status(code).render('errors/'+code, { data: verbose ? err : undefined, statusCode: code });
		case 'text/plain':
		default:
			return res.send(code, 'HTTP '+code+' error: '+(verbose ? err : ''));
		}
	}
}

module.exports = error;
