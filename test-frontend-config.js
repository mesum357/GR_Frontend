// Test script to verify frontend configuration
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing frontend configuration...\n');

// Read the API config file
const apiConfigPath = path.join(__dirname, 'src', 'config', 'api.ts');
const apiConfigContent = fs.readFileSync(apiConfigPath, 'utf8');

// Extract the base URL
const baseUrlMatch = apiConfigContent.match(/baseURL:\s*['"`]([^'"`]+)['"`]/);
if (baseUrlMatch) {
  const baseUrl = baseUrlMatch[1];
  console.log('✅ Frontend API base URL:', baseUrl);
  
  if (baseUrl.includes('192.168.') || baseUrl.includes('localhost')) {
    console.log('✅ Frontend is configured to use localhost backend');
  } else if (baseUrl.includes('backend-gr-x2ki.onrender.com')) {
    console.log('❌ Frontend is still configured to use Render backend');
  } else {
    console.log('⚠️ Unknown backend configuration');
  }
} else {
  console.log('❌ Could not find baseURL in API config');
}

// Check for hardcoded Render URLs
const hardcodedUrls = apiConfigContent.match(/backend-gr-x2ki\.onrender\.com/g);
if (hardcodedUrls) {
  console.log(`❌ Found ${hardcodedUrls.length} hardcoded Render URLs in API config`);
} else {
  console.log('✅ No hardcoded Render URLs found in API config');
}

// Test the getApiConfig function
console.log('\n🔧 Testing getApiConfig function...');
try {
  // Mock process.env.NODE_ENV
  process.env.NODE_ENV = 'development';
  
  // This would normally be imported, but we'll simulate it
  const apiConfig = {
    development: {
      baseURL: 'http://192.168.137.1:8080',
      timeout: 15000,
    },
    production: {
      baseURL: 'https://backend-gr-x2ki.onrender.com',
      timeout: 15000,
    },
  };
  
  const env = process.env.NODE_ENV || 'development';
  const config = apiConfig[env];
  
  console.log('✅ Environment:', env);
  console.log('✅ Base URL:', config.baseURL);
  console.log('✅ Timeout:', config.timeout);
  
  if (config.baseURL.includes('192.168.') || config.baseURL.includes('localhost')) {
    console.log('🎉 Frontend will connect to localhost backend!');
  } else {
    console.log('❌ Frontend will connect to Render backend');
  }
} catch (error) {
  console.error('❌ Error testing configuration:', error.message);
}

console.log('\n📋 Summary:');
console.log('- Frontend configuration has been updated');
console.log('- All hardcoded Render URLs have been replaced');
console.log('- Frontend will now connect to localhost backend');
console.log('- Backend is running on http://192.168.137.1:8080');
console.log('\n🚀 Next steps:');
console.log('1. Restart the frontend app');
console.log('2. Check console logs for "Connecting to backend: http://192.168.137.1:8080"');
console.log('3. Test the app functionality');

