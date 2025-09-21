// Test script for LocationService functionality
const { LocationService } = require('./src/services/LocationService');

console.log('🧪 Testing LocationService...\n');

// Test 1: Popular Places
console.log('📍 Popular Places:');
const popularPlaces = LocationService.getPopularPlaces();
popularPlaces.forEach((place, index) => {
  console.log(`${index + 1}. ${place.name} (${place.latitude}, ${place.longitude})`);
});

console.log('\n');

// Test 2: Distance Calculation
console.log('📏 Distance Calculation:');
const distance = LocationService.calculateDistance(35.9208, 74.3144, 35.9250, 74.3200);
console.log(`Distance from Gilgit City Center to Gilgit Airport: ${distance.toFixed(2)} km`);

console.log('\n');

// Test 3: Nearest Popular Place
console.log('🎯 Nearest Popular Place:');
const nearestPlace = LocationService.getNearestPopularPlace(35.9208, 74.3144);
console.log(`Nearest place to (35.9208, 74.3144): ${nearestPlace.name}`);

console.log('\n✅ LocationService tests completed!');
