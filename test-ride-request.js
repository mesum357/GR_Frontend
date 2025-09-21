const fetch = require('node-fetch');

async function testRideRequest() {
  try {
    // First, let's test the health endpoint
    console.log('Testing health endpoint...');
    const healthResponse = await fetch('http://192.168.98.62:8080/api/health');
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);

    // Now test the ride request endpoint (this will fail due to auth, but we can see the error)
    console.log('\nTesting ride request endpoint...');
    const rideResponse = await fetch('http://192.168.98.62:8080/api/ride-requests/request-ride', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No auth token - this should give us an auth error
      },
      body: JSON.stringify({
        pickup: {
          latitude: 35.9208,
          longitude: 74.3144,
          address: 'Test Location'
        },
        destination: {
          latitude: 35.9250,
          longitude: 74.3200,
          address: 'Test Destination'
        },
        offeredFare: 100
      })
    });

    const rideData = await rideResponse.json();
    console.log('Ride request response:', rideData);
    console.log('Status:', rideResponse.status);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRideRequest();

