const fetch = require('node-fetch');

async function testRegistration() {
  try {
    console.log('🧪 Testing registration endpoint...');
    
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '1234567890',
        password: 'password123',
        userType: 'rider'
      })
    });
    
    const data = await response.json();
    console.log('✅ Registration test response:', data);
    
  } catch (error) {
    console.error('❌ Registration test failed:', error.message);
  }
}

testRegistration();

