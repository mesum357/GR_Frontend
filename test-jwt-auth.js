const jwt = require('jsonwebtoken');

// Test JWT authentication
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZDA0NTM2Y2NiNTU2OGRjNGRkNjNiNyIsImVtYWlsIjoic2FtcmFuQGdhbmR1LmNvbSIsInVzZXJUeXBlIjoiZHJpdmVyIiwiaWF0IjoxNzU4NDc5Njg1LCJleHAiOjE3NTkwODQ0ODV9.GAahrUCX5PnFZMBHzz4cerUzR3Igy3j-S6zXL3sIHKU';

console.log('🧪 Testing JWT Authentication...\n');

// Test with the secret from .env
const secret = 'your-jwt-secret';

try {
  const decoded = jwt.verify(token, secret);
  console.log('✅ JWT Token is valid!');
  console.log('📄 Decoded payload:', JSON.stringify(decoded, null, 2));
  
  // Test API call
  const fetch = require('node-fetch');
  
  console.log('\n🌐 Testing API call with valid token...');
  
  fetch('http://192.168.137.1:8080/api/drivers/check-registration', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('📊 Response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('📄 Response data:', JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('❌ API call failed:', error.message);
  });
  
} catch (error) {
  console.error('❌ JWT Token verification failed:', error.message);
}

