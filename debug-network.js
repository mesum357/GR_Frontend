const http = require('http');

// Test server connectivity
function testServerConnectivity() {
  console.log('🔍 Testing server connectivity...');
  
  const options = {
    hostname: '192.168.1.14',
    port: 5000,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Server is reachable! Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Server connection failed:', error.message);
    console.error('This might be a firewall or network issue');
  });

  req.on('timeout', () => {
    console.error('❌ Request timed out');
    req.destroy();
  });

  req.end();
}

// Test localhost connectivity
function testLocalhost() {
  console.log('\n🔍 Testing localhost connectivity...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Localhost is reachable! Status: ${res.statusCode}`);
  });

  req.on('error', (error) => {
    console.error('❌ Localhost connection failed:', error.message);
  });

  req.end();
}

// Run tests
testServerConnectivity();
testLocalhost();

console.log('\n📋 Troubleshooting steps:');
console.log('1. Make sure the server is running: node server-simple.js');
console.log('2. Check Windows Firewall - allow Node.js');
console.log('3. Check if port 5000 is not blocked');
console.log('4. Try using a different port (e.g., 3000)');
console.log('5. Make sure both devices are on the same network');
