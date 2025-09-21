const https = require('https');
const http = require('http');

const testConnection = async (url) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ ${url} - Status: ${res.statusCode}`);
        console.log(`📄 Response: ${data}`);
        resolve({ status: res.statusCode, data });
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ ${url} - Error: ${error.message}`);
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      console.error(`⏰ ${url} - Timeout`);
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
};

const testEndpoints = async () => {
  console.log('🧪 Testing iOS Connection to Backend...\n');
  
  const endpoints = [
    'http://192.168.0.222:8080/api/health',
    'http://localhost:8080/api/health',
    'http://192.168.0.222:8080/api/auth/register',
  ];
  
  for (const endpoint of endpoints) {
    try {
      await testConnection(endpoint);
    } catch (error) {
      console.error(`Failed to test ${endpoint}:`, error.message);
    }
    console.log('---');
  }
  
  console.log('✅ Connection test completed!');
};

testEndpoints();
