
const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/user',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log('Response complete.');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
  console.error('Make sure the dev server is running: npm run dev');
});

req.setTimeout(5000, () => {
  console.error('Request timed out. Is the server running on port 3000?');
  req.destroy();
});

req.end();
