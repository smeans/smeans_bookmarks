var http = require('http');
var assert = require('assert');
var http = require('http');

var HTTP_HOST = "localhost";
var HTTP_PORT = 4000;

var tests = [
	{
		description: 'verify empty bookmark list',
		request: {method:'GET', path:'/bookmarks'},
		response: {data: {}}
	},
	{
		description: 'attempt to add bookmark without authentication',
		request: {method:'POST', path:'/bookmarks', data:{description: 'The Onion', url:'http://theonion.com'}},
		response: {expectedStatus: 401}
	},
	{
		description: 'attempt to add bookmark with bad username/password',
		request: {method:'POST', path:'/bookmarks', data:{description: 'The Onion', url:'http://theonion.com'},
			auth:{user: 'abcd', pass:'abcd'}},
		response: {expectedStatus: 401}
	},
	{
		description: 'add onion bookmark with valid username/password',
		request: {method:'POST', path:'/bookmarks', data:{description: 'The Onion', url:'http://theonion.com'},
			auth:{user: 'abcd', pass:'dcba'}},
		response: {data: { 'The Onion': 'http://theonion.com' }}
	},
	{
		description: 'attempt to add onion bookmark with valid username/password but missing url',
		request: {method:'POST', path:'/bookmarks', data:{description: 'The Onion'},
			auth:{user: 'abcd', pass:'dcba'}},
		response: {expectedStatus: 400}
	},
	{
		description: 'add google bookmark with valid username/password',
		request: {method:'POST', path:'/bookmarks', data:{description: 'Google', url:'https://google.com'},
			auth:{user: 'abcd', pass:'dcba'}},
		response: {data: { 'The Onion': 'http://theonion.com', Google: 'https://google.com' }}
	},
	{
		description: 'add another onion bookmark with same description',
		request: {method:'POST', path:'/bookmarks', data:{description: 'The Onion', url:'http://www.theonion.com/article/woman-pieces-together-timeline-boyfriends-past-rel-54036'},
			auth:{user: 'abcd', pass:'dcba'}},
		response: {data: {"The Onion":["http://theonion.com","http://www.theonion.com/article/woman-pieces-together-timeline-boyfriends-past-rel-54036"],"Google":"https://google.com"}}
	}
];

var nextTest = 0;

function runNextTest() {
	if (nextTest >= tests.length) {
		return;
	}

	var test = tests[nextTest];

	console.log('running test #' + nextTest + ': ' + test.description);
	var options = {host:HTTP_HOST, port:HTTP_PORT,  path:test.request.path,
			method: test.request.method, headers: {}};

	if ('auth' in test.request) {
		var auth = test.request.auth;

		options.headers['Authorization'] = 'Basic ' + new Buffer(auth.user + ':' + auth.pass).toString('base64');
	}

	var req = http.request(options, function (resp) {
			assert.equal(resp.statusCode, test.response.expectedStatus || 200,
					'unexpected HTTP status code returned: ' + resp.statusCode);

			var body = '';
			resp.on('data', function (chunk) {
				body += chunk;
			});

			resp.on('end', function () {
				if ('data' in test.response) {
					var data = JSON.parse(body);
					assert.deepEqual(data, test.response.data);
				}

				nextTest++;
				runNextTest();
			});

			resp.on('error', function (error) {
				assert.ifError(error);
			});
		});

		if ('data' in test.request) {
			req.write(JSON.stringify(test.request.data));
		}

		req.end();
}

runNextTest();
