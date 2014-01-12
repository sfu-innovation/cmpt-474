
var app = require('../'),
	request = require('supertest');

var key = '4ee94fe93aaea14af2923a4e2b7a01bd708b8ca1df988734fd338ee6';




describe('/', function() {
	describe('GET', function() {

		it('should return basic information', function(done) {
			request(app).get('/')
				.set('Accept', 'application/json')
				.expect('Content-Type', /json/)
				.expect(200)
				.expect({ version: '1.0.1', name: 'cloud' })
				.end(done);
		});
		
		it('should return the API key when present', function(done) {
			request(app).get('/')
				.set('Accept', 'application/json')
				.set('X-API-Key', key)
				.expect('Content-Type', /json/)
				.expect(200)
				.expect({ version: '1.0.1', name: 'cloud', apiKey: key })
				.end(done);
		});

		it('should fail on an invalid API key', function(done) {
			request(app).get('/')
				.set('Accept', 'application/json')
				.set('X-API-Key', 'ertfdgsg')
				.expect('Content-Type', /json/)
				.expect(403)
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
				.expect({ apiKey: /[a-zA-Z0-9]+/ })
				.end(done);
		});
	});
});

describe('/api-key/:id', function() {
	describe('GET', function() {
		it('should return information about the API key', function(done) {
			request(app).get('/api-key/'+key)
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


describe('/service/:id', function() {
	describe('GET', function() {

	});
	describe('PUT', function() {

	});
	describe('DELETE', function() {

	});
});

describe('/instance/:id', function() {
	describe('GET', function() {

	});
	describe('PUT', function() {

	});
	describe('DELETE', function() {

	});
});

describe('/topology', function() {
	describe('GET', function() {

	});
	describe('PUT', function() {

	});
	describe('DELETE', function() {

	});
});

describe('/benchmark/:id', function() {
	describe('GET', function() {

	});
	describe('PUT', function() {

	});
	describe('DELETE', function() {

	});
});
