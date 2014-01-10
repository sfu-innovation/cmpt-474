// RFC 2616 (HTTP/1.1)
module.exports = function() {
	var methods = Array.prototype.slice.call(arguments);
	return function(req, res, next) {
		//console.log('WTF')
		//console.log(req.method+' vs '+methods.join())
		if (methods.indexOf(req.method) === -1)
			return res.status(405).set('Allow', methods.join(', ')).end();
		else
			return next();
	}
}