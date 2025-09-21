// API Configuration
const API_CONFIG = {
  // Development - use Render backend for consistency
  development: {
    baseURL: 'https://backend-gr-x2ki.onrender.com', // Render backend
    timeout: 15000,
  },
  // Production - use your actual domain
  production: {
    baseURL: 'https://backend-gr-x2ki.onrender.com',
    timeout: 15000, // Increased timeout for deployed backend
  },
};

// Google Maps Configuration
export const GOOGLE_MAPS_CONFIG = {
  // Your Google Maps API key
  API_KEY: 'AIzaSyDyPrl-d-4u6LMA53mErpIx2yIFiy_1JSc',
  
  // Default map settings for Gilgit region
  DEFAULT_REGION: {
    latitude: 35.9213, // Gilgit coordinates
    longitude: 74.3082,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  
  // Driver search radius in kilometers
  DRIVER_SEARCH_RADIUS: 1.5,
  
  // Map styling (you can customize this)
  MAP_STYLE: [],
};

// Google APIs endpoints
export const GOOGLE_API_ENDPOINTS = {
  geocoding: (address: string) => 
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_CONFIG.API_KEY}`,
  reverseGeocoding: (lat: number, lng: number) => 
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_CONFIG.API_KEY}`,
  directions: (origin: string, destination: string) => 
    `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_CONFIG.API_KEY}`,
  places: (lat: number, lng: number, radius: number = 1000) => 
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${GOOGLE_MAPS_CONFIG.API_KEY}`,
  placeAutocomplete: (input: string, location?: { lat: number; lng: number }, radius?: number) => {
    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_CONFIG.API_KEY}`;
    if (location && radius) {
      url += `&location=${location.lat},${location.lng}&radius=${radius}`;
      // Bias to Pakistan and prioritize Gilgit-Baltistan region
      url += `&components=country:pk`;
    }
    return url;
  },
  placeDetails: (placeId: string) => 
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,geometry&key=${GOOGLE_MAPS_CONFIG.API_KEY}`,
  distanceMatrix: (origins: string[], destinations: string[]) => 
    `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins.join('|')}&destinations=${destinations.join('|')}&key=${GOOGLE_MAPS_CONFIG.API_KEY}`,
};

import { Platform } from 'react-native';

// Configuration flags
const USE_PRODUCTION_BACKEND = false; // Set to false since Railway is not responding
const FALLBACK_TO_LOCALHOST = false; // Set to false to use only Render backend

// Get current environment
const getEnvironment = () => {
  // If USE_PRODUCTION_BACKEND is true, force production mode
  if (USE_PRODUCTION_BACKEND) {
    return 'production';
  }
  
  // Otherwise use environment variable or default to development
  return process.env.NODE_ENV || 'development';
};

// Auto-detect network IP or use fallback
const getNetworkIP = () => {
  // Use localhost backend
  return '192.168.98.62';
};

// Get base URL based on platform
const getBaseURL = () => {
  // Use localhost backend
  return 'https://backend-gr-x2ki.onrender.com';
};

// Get API config for current environment
export const getApiConfig = () => {
  const env = getEnvironment();
  const baseURL = getBaseURL();
  
  return {
    baseURL,
    timeout: 10000,
  };
};

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    profile: '/api/auth/profile',
    changePassword: '/api/auth/change-password',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
  },
  // User endpoints
  users: {
    all: '/api/users',
    byId: (id: string) => `/api/users/${id}`,
    location: '/api/users/location',
    onlineStatus: '/api/users/online-status',
    nearbyDrivers: '/api/users/nearby/drivers',
    wallet: '/api/users/wallet',
    stats: '/api/users/stats/summary',
  },
  // Ride endpoints
  rides: {
    book: '/api/rides/book',
    available: '/api/rides/available',
    byId: (id: string) => `/api/rides/${id}`,
    accept: (id: string) => `/api/rides/${id}/accept`,
    start: (id: string) => `/api/rides/${id}/start`,
    complete: (id: string) => `/api/rides/${id}/complete`,
    cancel: (id: string) => `/api/rides/${id}/cancel`,
    rate: (id: string) => `/api/rides/${id}/rate`,
    history: '/api/rides/history',
  },
  // Driver endpoints
  drivers: {
    stats: '/api/drivers/stats',
    currentRide: '/api/drivers/current-ride',
    rideHistory: '/api/drivers/ride-history',
    earnings: '/api/drivers/earnings',
    schedule: '/api/drivers/schedule',
    performance: '/api/drivers/performance',
  },
};

// Helper function to build full URL
export const buildApiUrl = (endpoint: string) => {
  const config = getApiConfig();
  return `${config.baseURL}${endpoint}`;
};

// Helper function for API requests with retry mechanism
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const config = getApiConfig();
  const url = buildApiUrl(endpoint);
  console.log(`📡 Connecting to Render backend: ${url}`);
  const response = await makeRequestWithRetry(url, options);
  
  // Parse JSON and handle errors
  let data;
  try {
    data = await response.json();
    console.log('📥 Response data:', data);
  } catch (parseError) {
    console.error('❌ Failed to parse response as JSON:', parseError);
    throw new Error(`Invalid response format: ${response.status}`);
  }

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `HTTP ${response.status}`;
    console.error('❌ API Error:', errorMessage);
    throw new Error(errorMessage);
  }

  return data;
};

// Helper function to check if server is responsive
const checkServerHealth = async (baseUrl: string): Promise<boolean> => {
  try {
    console.log(`🏥 Checking server health: ${baseUrl}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check
    
    const response = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Even 401/403 responses mean the server is running
    if (response.status === 401 || response.status === 403) {
      console.log('✅ Server is responsive (auth required)');
      return true;
    }
    
    if (response.ok) {
      console.log('✅ Server is responsive');
      return true;
    }
    
    console.log(`⚠️ Server responded with status: ${response.status}`);
    return false;
  } catch (error) {
    console.log(`❌ Server health check failed: ${error.message}`);
    return false;
  }
};

// Helper function to wake up Railway server (cold start)
const wakeUpServer = async (baseUrl: string) => {
  try {
    console.log('🌅 Waking up Railway server...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for wake-up
    
    await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log('✅ Server is awake');
  } catch (error) {
    console.log('⚠️ Wake-up request failed, but continuing...');
  }
};

// Helper function to make requests with retry mechanism
const makeRequestWithRetry = async (url: string, options: RequestInit = {}, retryCount = 0) => {
  const maxRetries = 2;
  
  try {
    return await makeRequest(url, options);
  } catch (error) {
    // If it's a timeout error and we haven't exceeded max retries, try again
    if (error.message.includes('timeout') && retryCount < maxRetries) {
      console.log(`🔄 Retrying request (attempt ${retryCount + 1}/${maxRetries + 1})...`);
      
      // Check server health before retry
      const baseUrl = url.split('/api/')[0];
      const isHealthy = await checkServerHealth(baseUrl);
      
      if (!isHealthy) {
        console.log('❌ Server is not responsive, trying next server...');
        throw error; // This will trigger the next fallback IP
      }
      
      // Wake up the server before retry
      await wakeUpServer(baseUrl);
      
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retry
      return await makeRequestWithRetry(url, options, retryCount + 1);
    }
    throw error;
  }
};

// Helper function to make individual requests
const makeRequest = async (url: string, options: RequestInit = {}) => {
  const env = getEnvironment();
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for Railway cold starts
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'TouristApp/1.0',
      ...options.headers,
    },
    signal: controller.signal,
  };

  const finalOptions = { ...defaultOptions, ...options };
  
  console.log('🌐 API Request Debug:');
  console.log('Environment:', env);
  console.log('URL:', url);
  console.log('Method:', options.method || 'GET');
  console.log('Headers:', JSON.stringify(finalOptions.headers, null, 2));
  console.log('Body:', options.body);
  console.log('Final Options:', JSON.stringify(finalOptions, null, 2));

  try {
    const response = await fetch(url, finalOptions);
    clearTimeout(timeoutId);
    console.log('📥 Response status:', response.status);
    
    // Return the response object so callers can check response.ok and call response.json()
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('❌ Request timeout');
      throw new Error('Request timeout. Please check your internet connection and try again.');
    }
    throw error;
  }
};

// Helper function for authenticated API requests that returns Response object
export const authenticatedApiRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  // Get token from AsyncStorage or context
  const token = await getStoredToken();
  
  const config = getApiConfig();
  const url = buildApiUrl(endpoint);
  console.log(`📡 Connecting to Render backend: ${url}`);
  
  const response = await makeRequestWithRetry(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response;
};

// Helper function for authenticated API requests that returns parsed data
export const authenticatedApiRequestData = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  // Get token from AsyncStorage or context
  const token = await getStoredToken();
  
  return apiRequest(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};

// Helper function to get stored token
const getStoredToken = async (): Promise<string> => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  } catch (error) {
    throw new Error('Failed to retrieve authentication token');
  }
};
