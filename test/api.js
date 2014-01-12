
var app = require('../'),
	request = require('supertest'),
	ApiKey = require('../lib/models/api-key');

var key = '4ee94fe93aaea14af2923a4e2b7a01bd708b8ca1df988734fd338ee6';


app.get('store').put(ApiKey, {
	id: key,
	active: true
}, function(err) {

})

app.get('store').put({
	id: 'bananas',
	active: false
}, ApiKey, function(err) {

})

describe('/', function() {
	describe('GET', function() {

		it('should return basic information', function(done) {
			request(app).get('/')
				.set('Accept', 'application/json')
				.expect('Content-Type', /json/)
				.expect(200)
				.expect({ 
					version: '1.0.1', 
					name: 'cloud', 
					authentication: false 
				})
				.end(done);
		});
		
		it('should return authentication data when present', function(done) {
			request(app).get('/')
				.set('Accept', 'application/json')
				.set('X-API-Key', key)
				.expect('Content-Type', /json/)
				.expect(200)
				.expect({ 
					version: '1.0.1', 
					name: 'cloud', 
					authentication: {
						type: "api-key",
						value: key
					}
				})
				.end(done);
		});

		it('should fail on a non-existant API key', function(done) {
			request(app).get('/')
				.set('Accept', 'application/json')
				.set('X-API-Key', 'ertfdgsg')
				.expect('Content-Type', /json/)
				.expect(401)
				.end(done);
		});

		it('should fail on an inactive API key', function(done) {
			request(app).get('/')
				.set('Accept', 'application/json')
				.set('X-API-Key', 'bananas')
				.expect('Content-Type', /json/)
				.expect(401)
				.end(done);
		});

		it('should fail if the request does not accept json', function(done) {
			request(app).get('/')
				.set('Accept', 'text/html')
				.expect(406)
				.end(done);
		})
	});

	describe('POST', function() {
		it('should be not allowed', function(done) {
			request(app).post('/')
				.expect(405)
				.expect('Allow', 'GET')
				.end(done);
		});
	});

	describe('DELETE', function() {
		it('should be not allowed', function(done) {
			request(app).del('/')
				.expect(405)
				.expect('Allow', 'GET')
				.end(done);
		});
	});
});


describe('/api-key', function() {
	describe('POST', function() {
		it('should fail if no e-mail is present', function(done) {
			request(app).post('/api-key')
				.set('Accept', 'application/json')
				.set('Content-Type', 'application/json')
				.send({ })
				.expect(400)
				.end(done);
		});
		it('should create and return a new inactive API key', function(done) {
			request(app).post('/api-key')
				.set('Accept', 'application/json')
				.set('Content-Type', 'application/json')
				.send({ email: 'test@sfu.ca' })
				.expect(201)
				.expect(/"value":\s*"[a-z0-9]+"/)
				.end(done);
		});
	});
});

describe('/api-key/:id', function() {
	describe('GET', function() {
		it('should return information about the API key', function(done) {
			request(app).get('/api-key/'+key)
				.set('Accept', 'application/json')
				.set('X-API-Key', key)
				.expect(200)
				.end(done);
		});
		it('should fail if the requester is neither the owner nor an admin', function(done) {
			request(app).get('/')
				.end(done);
		});
	});

	describe('DELETE', function() {
		it('should fail if the requester is neither the owner nor an admin', function(done) {
			request(app).del('/api-key')
				.end(done);
		});
		it('should delete an existing API key', function(done) {
			request(app).del('/api-key')
				.end(done);
		});
	});
});

describe('/service', function() {
	
	describe('GET', function() {
		it('should not be allowed', function(done) {
			request(app).get('/service')
				.expect(405)
				.expect('Allow', 'POST')
				.end(done);
		});
	});
	describe('POST', function() {
		it('should create a new service');
	});
})

describe('/service/:id', function() {
	describe('DELETE', function() {
		it('should delete a specified service');
		it('should respond with not found if the service does not exist');
	});
	describe('GET', function() {
		it('should fetch an existing service');
		it('should respond with not found if the service does not exist');
	});
	describe('POST', function() {
		it('should not be allowed');
	})
	describe('PUT', function() {
		it('should write a specified service');
	});
	
});

describe('/instance/:id', function() {
	describe('DELETE', function() {
		it('should delete an existing instance');
	});
	describe('GET', function() {
		it('should fetch an existing instance');
		it('should respond with not found if the instance does not exist');
	});
	describe('POST', function() {

	});
	describe('PUT', function() {
		it('shoud write a specified instance');
	});
	
});

describe('/topology', function() {
	describe('DELETE', function() {

	});
	describe('GET', function() {

	});
	describe('POST', function() {

	});
	describe('PUT', function() {

	});
});

describe('/topology/:id', function() {
	describe('DELETE', function() {

	});
	describe('GET', function() {

	});
	describe('POST', function() {

	});
	describe('PUT', function() {

	});
});

describe('/benchmark', function() {
	describe('DELETE', function() {

	});
	describe('GET', function() {

	});
	describe('POST', function() {

	});
	describe('PUT', function() {

	});
});

describe('/benchmark/:id', function() {
	describe('DELETE', function() {

	});
	describe('GET', function() {

	});
	describe('POST', function() {

	});
	describe('PUT', function() {

	});
});
