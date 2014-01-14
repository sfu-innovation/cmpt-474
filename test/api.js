
var app = require('../'),
	request = require('supertest'),
	ApiKey = require('../lib/models/api-key'),
	Service = require('../lib/models/service'),
	Instance = require('../lib/models/instance'),
	assert = require('assert');

var apiKey = {
	id: 'a5368912-bd10-4c5c-84af-d59efa703858',
	token: '4ee94fe93aaea14af2923a4e2b7a01bd708b8ca1df988734fd338ee6',
	active: true,
	principal: '1d9435ba-b842-4969-9656-7a1938b15bc2',
	email: 'test@domain.com'
};

app.get('store').put(ApiKey, apiKey, function(err) {

})

app.get('store').put(ApiKey, {
	id: 'd655d013-ec38-4ad6-8907-fa2fc7992d93',
	token: 'bananas',
	active: false,
	email: 'inactive@domain.com',
	principal: 'e8d6255c-7c9b-453b-add2-9b91ba8e4259'
}, function(err) {

})

app.get('store').put(Service, {
	id: '65cedc09-9657-46aa-8609-8237339be51f',
	type: 'redis',
	owner: 'e8d6255c-7c9b-453b-add2-9b91ba8e4259',
	createdOn: Date.now(),
	configuration: {
		port: 9323
	}
}, function(err) {

})

app.get('store').put(Instance, {
	id: '79f1b010-8299-4468-89c7-d6883d705d74',
	owner: 'e8d6255c-7c9b-453b-add2-9b91ba8e4259',
	createdOn: Date.now(),
	services: [{
		type: 'redis',
		configuration: {
			port: 5352
		}
	}]
}, function(err) {

})

var isUUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
	isToken = /[0-9a-f]{56}/,
	isNumber = /[0-9]+/;

//Override supertest's assert to provide smarter object checking
//since it is impossible for HTTP JSON to return any non-simple type
//(function, regex, data, etc.) exploit this to smartly check those
//objects when they're encountered.
var http = require('http'), assert = require('assert'), util = require('util');
request.Test.prototype.assert = function(res, fn){
	
	function error(msg, expected, actual) {
		var err = new Error(msg);
		err.expected = expected;
		err.actual = actual;
		err.showDiff = true;
		return err;
	}

	var status = this._status, 
		fields = this._fields, 
		bodies = this._bodies, 
		expecteds, 
		actual, 
		re;

	// status
	if (status && res.status !== status) {
		var a = http.STATUS_CODES[status];
		var b = http.STATUS_CODES[res.status];
		return fn(new Error('expected ' + status + ' "' + a + '", got ' + res.status + ' "' + b + '"'), res);
	}

	// body
	for (var i = 0; i < bodies.length; i++) {
		var body = bodies[i];
		var isregexp = body instanceof RegExp;
		// parsed
		if ('object' == typeof body && !isregexp) {
			try {
				(function check(name, target, value) {
					
					if (target instanceof RegExp) {
						if (!target.test(value))
							throw new Error(name+': '+target+' does not match '+value);
						return;
					}

					switch(typeof target) {
					case 'string':
					case 'boolean':
					case 'number':
						return assert.strictEqual(target, value, name+': expected '+target+'; got '+value);
					case 'function':
						return target(value);
					case 'object':
						for (var key in target)
							check(name+'.'+key, target[key], value[key])
						for (var key in value) 
							if (typeof target[key] === 'undefined')
								throw new Error(name+': missing property '+key+' = '+value[key]);
						return;
					default:
						throw new TypeError('Something went wrong.');
					}
				})('body', body, res.body);
			} catch (err) {
				
				return fn(err);
			}
		} 
		else {
			// string
			if (body !== res.text) {
				var a = util.inspect(body);
				var b = util.inspect(res.text);

				// regexp
				if (isregexp) {
	 				if (!body.test(res.text)) {
						return fn(error('expected body ' + b + ' to match ' + body, body, res.body));
					}
				} 
				else {
					return fn(error('expected ' + a + ' response body, got ' + b, body, res.body));
				}
			}
		}
	}

	// fields
	for (var field in fields) {
		expecteds = fields[field];
		actual = res.header[field.toLowerCase()];
		if (null == actual) return fn(new Error('expected "' + field + '" header field'));
		for (var i = 0; i < expecteds.length; i++) {
			var fieldExpected = expecteds[i];
			if (fieldExpected == actual) continue;
			if (fieldExpected instanceof RegExp) re = fieldExpected;
			if (re && re.test(actual)) continue;
			if (re) return fn(new Error('expected "' + field + '" matching ' + fieldExpected + ', got "' + actual + '"'));
			return fn(new Error('expected "' + field + '" of "' + fieldExpected + '", got "' + actual + '"'));
		}
	}

	fn.call(this, null, res);
};







describe('/', function() {
	describe('GET', function() {

		it('should return basic information', function(done) {
			request(app).get('/')
				.set('Accept', 'application/json')
				.expect(200)
				.expect('Content-Type', /json/)
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
				.set('X-API-Key', apiKey.token)
				.expect(200)
				.expect('Content-Type', /json/)
				.expect({ 
					version: '1.0.1', 
					name: 'cloud', 
					authentication: {
						type: "api-key",
						value: apiKey.token
					},
					principal: apiKey.principal
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
				.expect('Content-Type', /json/)
				.expect({
					id: isUUID,
					email: 'test@sfu.ca',
					token: isToken,
					active: false,
					verified: false,
					principal: isUUID
				})
				.end(done);
		});
	});
});

describe('/api-key/:id', function() {
	describe('GET', function() {
		it('should return information about the API key', function(done) {
			request(app).get('/api-key/'+apiKey.id)
				.set('Accept', 'application/json')
				.set('X-API-Key', apiKey.token)
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
	
	describe('DELETE', function() {
		it('should not be allowed', function(done) {
			request(app).del('/service')
				.expect(405)
				.expect('Allow', 'GET, POST')
				.end(done);
		})
	});

	describe('GET', function() {
		it('should respond with a list of defined services', function(done) {
			request(app).get('/service')
				.set('Accept', 'application/json')
				.send()
				.expect(200)
				.end(done);
		});
	});

	describe('POST', function() {
		
		it('should fail if not authenticated', function(done) {
			request(app).post('/service')
				.set('Accept', 'application/json')
				.set('Content-Type', 'application/json')
				.send({ type: 'redis' })
				.expect(401)
				.end(done);
		});

		it('should fail on invalid service type', function(done) {
			request(app).post('/service')
				.set('Accept', 'application/json')
				.set('Content-Type', 'application/json')
				.set('X-API-Key', apiKey.token)
				.send({ type: 'bananas' })
				.expect(400)
				.end(done);
		});

		it('should ignore owner and id properties', function(done) {
			request(app).post('/service')
				.set('Accept', 'application/json')
				.set('Content-Type', 'application/json')
				.set('X-API-Key', apiKey.token)
				.send({ 
					id: '2914b9ee-760c-4abe-b39d-ca8319894806',
					owner: 'e8d6255c-7c9b-453b-add2-9b91ba8e4259',
					type: 'redis'
				})
				.expect(201)
				.expect('Content-Type', /json/)
				.expect({
					id: isUUID,
					owner: apiKey.principal,
					createdOn: isNumber, 
					type: 'redis',
					configuration: { }
				})
				.end(done);
		})
		
		it('should create a new redis service', function(done) {
			request(app).post('/service')
				.set('Accept', 'application/json')
				.set('Content-Type', 'application/json')
				.set('X-API-Key', apiKey.token)
				.send({ type: 'redis' })
				.expect(201)
				.expect('Content-Type', /json/)
				.expect({
					id: isUUID,
					owner: apiKey.principal, 
					createdOn: isNumber, 
					type: 'redis',
					configuration: { }
				})
				.end(done);
		});

		it('should create a new python service', function(done) {
			request(app).post('/service')
				.set('Accept', 'application/json')
				.set('Content-Type', 'application/json')
				.set('X-API-Key', apiKey.token)
				.send({ type: 'python' })
				.expect(201)
				.expect('Content-Type', /json/)
				.expect({
					id: isUUID,
					owner: apiKey.principal, 
					createdOn: isNumber, 
					type: 'python',
					configuration: { }
				})
				.end(done);
		});
	});

	describe('PUT', function() {
		it('should not be allowed', function(done) {
			request(app).put('/service')
				.expect(405)
				.expect('Allow', 'GET, POST')
				.end(done);
		})
	})
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

describe('/instance', function() {
	
	describe('DELETE', function() {
		it('should not be allowed', function(done) {
			request(app).del('/instance')
				.expect(405)
				.expect('Allow', 'GET, POST')
				.end(done);
		});
	});
	
	describe('GET', function() {
		it('should fetch a list of existing instances');
	});
	
	describe('POST', function() {
		
		it('should fail if not authenticated', function(done) {
			request(app).post('/instance')
				.set('Accept', 'application/json')
				.set('Content-Type', 'application/json')
				.send({ services: [ ] })
				.expect(401)
				.end(done);
		});

		it('should fail if no services are provided', function(done) {
			request(app).post('/instance')
				.set('Accept', 'application/json')
				.set('Content-Type', 'application/json')
				.set('X-API-Key', apiKey.token)
				.send({ services: [ ] })
				.expect(400)
				.end(done);
		});

		it('should fail if invalid services are provided', function(done) {
			request(app).post('/instance')
				.set('Accept', 'application/json')
				.set('Content-Type', 'application/json')
				.set('X-API-Key', apiKey.token)
				.send({ services: [ 'sfsdfwe' ] })
				.expect(400)
				.end(done);
		});

		it('should create a new instance with referenced services', function(done) {
			request(app).post('/instance')
				.set('Accept', 'application/json')
				.set('Content-Type', 'application/json')
				.set('X-API-Key', apiKey.token)
				.send({ 
					services: [ '65cedc09-9657-46aa-8609-8237339be51f' ] 
				})
				.expect(201)
				.expect('Content-Type', /json/)
				.expect({
					id: isUUID,
					owner: apiKey.principal,
					createdOn: isNumber,
					status: 'unknown',
					services: [{
						id: '65cedc09-9657-46aa-8609-8237339be51f',
						owner: 'e8d6255c-7c9b-453b-add2-9b91ba8e4259',
						createdOn: isNumber,
						type: 'redis',
						configuration: {
							port: 9323
						}
					}]
				})
				.end(done);
		});

		it('should create a new instance with in-place services', function(done) {
			var service = {
				type: 'redis',
				configuration: {
					port: 9993
				}
			};
			request(app).post('/instance')
				.set('Accept', 'application/json')
				.set('Content-Type', 'application/json')
				.set('X-API-Key', apiKey.token)
				.send({ 
					services: [ service ] 
				})
				.expect(201)
				.expect('Content-Type', /json/)
				.expect({
					id: isUUID,
					owner: apiKey.principal,
					createdOn: isNumber,
					status: 'unknown',
					services: [ service ]
				})
				.end(done);
		});
	});
	
	describe('PUT', function() {
		it('should not be allowed', function(done) {
			request(app).put('/instance')
				.expect(405)
				.expect('Allow', 'GET, POST')
				.end(done);
		});
	});
})

describe('/instance/:id', function() {
	describe('DELETE', function() {
		it('should delete an existing instance');
	});
	describe('GET', function() {
		
		it('should fetch an existing instance', function(done) {
			request(app).get('/instance/79f1b010-8299-4468-89c7-d6883d705d74')
				.set('Accept', 'application/json')
				.expect(200)
				.expect({
					id: '79f1b010-8299-4468-89c7-d6883d705d74',
					owner: 'e8d6255c-7c9b-453b-add2-9b91ba8e4259',
					createdOn: isNumber,
					services: [{
						type: 'redis',
						configuration: {
							port: 5352
						}
					}]
				})
				.end(done);
		});
		
		it('should respond with not found if the instance does not exist', function(done) {
			request(app).get('/instance/derp')
				.set('Accept', 'application/json')
				.expect(404)
				.end(done);
		});
	});
	
	describe('POST', function() {
		it('should not be allowed', function(done) { 
			request(app).post('/instance/79f1b010-8299-4468-89c7-d6883d705d74')
				.expect(405)
				.expect('Allow', 'GET')
				.end(done);
		});
	});

	describe('PUT', function() {
		it('shoud write a specified instance');
	});
	
});

describe('/instance/:id/start', function() {
	describe('POST', function() {
		it('start the instance', function(done) {
			request(app).post('/instance/79f1b010-8299-4468-89c7-d6883d705d74/start')
				.expect(202)
				.end(done);
		});
	});
});

describe('/instance/:id/stop', function() {
	describe('POST', function() {
		it('should stop the instance', function(done) {
			request(app).post('/instance/79f1b010-8299-4468-89c7-d6883d705d74/stop')
				.expect(202)
				.end(done);
		});
	});
});

describe('/instance/:id/freeze', function() {
	describe('POST', function() {
		it('should freeze the instance', function(done) {
			request(app).post('/instance/79f1b010-8299-4468-89c7-d6883d705d74/freeze')
				.expect(202)
				.end(done);
		});
	});
});

describe('/instance/:id/thaw', function() {
	describe('POST', function() {
		it('should thaw the instance', function(done) {
			request(app).post('/instance/79f1b010-8299-4468-89c7-d6883d705d74/thaw')
				.expect(202)
				.end(done);
		});
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

describe('/benchmark/:id/run', function() {
	describe('DELETE', function() {
		it('should not be allowed');
	});
	describe('GET', function() {
		it('should not be allowed');
	});
	describe('POST', function() {

	});
	describe('PUT', function() {
		it('should not be allowed');
	});
})
