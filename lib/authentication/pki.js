
// TODO: Is fingerprint enough? Given node doesn't pass through the full
// certificate.

module.exports = function() {
	return function() {
		return function(req, res, next) {
			
			// if behind an HTTPS proxy we trust, extract data from some trusted headers:
			// - X-Forwarded-For-Certificate-Fingerprint
			if (req.app.get('trust proxy') && req.get('X-Forwarded-For-Certificate-Fingerprint')) {
				req.authentication = { 
					fingerprint: req.get('X-Forwarded-For-Certificate-Fingerprint'),
					verified: true
				}
			}
			// if connnection is directly encrypted, then pull the certificate information
			// straight from the connection.
			else if (req.connection.encrypted) {
				req.authentication = {
					fingerprint: request.connection.getPeerCertificate().fingerprint,
					verified: request.connection.verifyPeer()
				}
			}

			// If we couldn't find any authentication data just bail.
			if (!req.authentication)
				return next();

			// If the certificate is valid then allow safe passage.
			if (req.authentication.verified) {
				req.authenticated = true;
				req.principal = 'pki:' + req.authentication.fingerprint;
			}

			// Carry on as if you were normal.
			return next();
		}
	}
}