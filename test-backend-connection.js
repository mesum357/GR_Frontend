// Test backend connection
const http = require('http');

const testBackend = () => {
  console.log('🔍 Testing backend connection...');
  
  const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/api/ride-requests/available-simple',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    }
  };

  const req = http.request(options, (res) => {
    console.log('✅ Backend is running!');
    console.log('Status:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
    });
  });

  req.on('error', (error) => {
    console.log('❌ Backend connection failed:', error.message);
  });

  req.setTimeout(5000, () => {
    console.log('❌ Backend timeout');
    req.destroy();
  });

  req.end();
};

testBackend();
