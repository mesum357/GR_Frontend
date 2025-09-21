import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

export class LocationService {
  static async getCurrentLocation(): Promise<LocationData> {
    try {
      console.log('📍 LocationService: Starting location request...');
      
      // Check if location services are enabled
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        console.warn('📍 Location services are disabled');
        throw new Error('Location services are disabled. Please enable location services in your device settings.');
      }

      // Request location permissions with better error handling
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('📍 Permission status:', status);
      
      if (status !== 'granted') {
        throw new Error('Location permission denied. Please enable location permissions in your device settings.');
      }

      // Get current position with platform-specific settings and timeout
      const locationOptions = {
        accuracy: Platform.OS === 'android' ? Location.Accuracy.Balanced : Location.Accuracy.High,
        timeInterval: Platform.OS === 'android' ? 20000 : 15000, // Increased timeout
        distanceInterval: Platform.OS === 'android' ? 100 : 50,
        maximumAge: 30000, // Accept cached location up to 30 seconds old
      };

      console.log('📍 Location options:', locationOptions);

      // Add timeout to prevent hanging
      const locationPromise = Location.getCurrentPositionAsync(locationOptions);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Location request timeout after 25 seconds')), 25000)
      );

      const location = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;
      console.log('📍 Location received:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy
      });

      // Try to get address with error handling and timeout
      let address = 'Current Location';
      try {
        // For Android, add extra validation and options
        const geocodeOptions = Platform.OS === 'android' ? {
          useGoogleMaps: true, // Enable Google Maps geocoding with proper API key
        } : {};
        
        const geocodePromise = Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }, geocodeOptions);
        
        const geocodeTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Geocoding timeout')), 8000) // Shorter timeout for Android
        );

        const addressResponse = await Promise.race([geocodePromise, geocodeTimeoutPromise]) as Location.LocationGeocodedAddress[];

        if (addressResponse && addressResponse.length > 0) {
          const addressData = addressResponse[0];
          
          // Prioritize place names like InDrive - try different combinations
          let placeName = '';
          
          // Try street + city combination first
          if (addressData.street && addressData.city) {
            placeName = `${addressData.street}, ${addressData.city}`;
          }
          // Try district + city combination
          else if (addressData.district && addressData.city) {
            placeName = `${addressData.district}, ${addressData.city}`;
          }
          // Try just the street name
          else if (addressData.street) {
            placeName = addressData.street;
          }
          // Try just the district name
          else if (addressData.district) {
            placeName = addressData.district;
          }
          // Try just the city name
          else if (addressData.city) {
            placeName = addressData.city;
          }
          // Try region name
          else if (addressData.region) {
            placeName = addressData.region;
          }
          
          if (placeName) {
            address = placeName;
          } else {
            // If no place name found, use a generic location name
            address = 'Current Location';
          }
        } else {
          // If no address response, try to find nearest popular place
          const nearestPlace = this.getNearestPopularPlace(location.coords.latitude, location.coords.longitude);
          address = nearestPlace.address;
        }
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed, trying nearest popular place:', geocodeError);
        // Try to find nearest popular place as fallback
        const nearestPlace = this.getNearestPopularPlace(location.coords.latitude, location.coords.longitude);
        address = nearestPlace.address;
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address,
      };
    } catch (error) {
      console.error('❌ Error getting current location:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Unable to get your current location.';
      
      if (error.message.includes('permission denied')) {
        errorMessage = 'Location permission denied. Please enable location permissions in your device settings.';
      } else if (error.message.includes('disabled')) {
        errorMessage = 'Location services are disabled. Please enable location services in your device settings.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Location request timed out. Please try again or check your internet connection.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error while getting location. Please check your internet connection.';
      }
      
      console.warn('📍 Using fallback location due to error:', errorMessage);
      
      // Return default Gilgit location if location access fails
      return {
        latitude: 35.9208,
        longitude: 74.3144,
        address: 'Gilgit City Center (Default Location)',
      };
    }
  }

  static async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string> {
    try {
      // For Android, add extra validation and options
      const geocodeOptions = Platform.OS === 'android' ? {
        useGoogleMaps: true, // Enable Google Maps geocoding with proper API key
      } : {};
      
      const geocodePromise = Location.reverseGeocodeAsync({
        latitude,
        longitude,
      }, geocodeOptions);
      
      const geocodeTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Geocoding timeout')), 8000) // Shorter timeout for Android
      );

      const addressResponse = await Promise.race([geocodePromise, geocodeTimeoutPromise]) as Location.LocationGeocodedAddress[];

      if (addressResponse && addressResponse.length > 0) {
        const addressData = addressResponse[0];
        
        // Prioritize place names like InDrive - try different combinations
        let placeName = '';
        
        // Try street + city combination first
        if (addressData.street && addressData.city) {
          placeName = `${addressData.street}, ${addressData.city}`;
        }
        // Try district + city combination
        else if (addressData.district && addressData.city) {
          placeName = `${addressData.district}, ${addressData.city}`;
        }
        // Try just the street name
        else if (addressData.street) {
          placeName = addressData.street;
        }
        // Try just the district name
        else if (addressData.district) {
          placeName = addressData.district;
        }
        // Try just the city name
        else if (addressData.city) {
          placeName = addressData.city;
        }
        // Try region name
        else if (addressData.region) {
          placeName = addressData.region;
        }
        
        if (placeName) {
          return placeName;
        } else {
          // If no place name found, use a generic location name
          return 'Unknown Location';
        }
      }

      // If no address response, use generic location name
      return 'Unknown Location';
    } catch (error) {
      console.warn('Reverse geocoding failed, using generic location name:', error);
      // Return generic location name as fallback
      return 'Unknown Location';
    }
  }

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  static async isLocationEnabled(): Promise<boolean> {
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      return isEnabled;
    } catch (error) {
      console.warn('Could not check location services:', error);
      return false;
    }
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  static async getCurrentLocationCoordinates(): Promise<{ latitude: number; longitude: number }> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const locationOptions = {
        accuracy: Platform.OS === 'android' ? Location.Accuracy.Balanced : Location.Accuracy.High,
        timeInterval: Platform.OS === 'android' ? 15000 : 10000,
        distanceInterval: Platform.OS === 'android' ? 100 : 50,
        maximumAge: 60000,
      };

      const locationPromise = Location.getCurrentPositionAsync(locationOptions);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Location request timeout')), 20000)
      );

      const location = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location coordinates:', error);
      throw error;
    }
  }

  // Popular places in Gilgit for better user experience
  static getPopularPlaces(): Array<{ name: string; latitude: number; longitude: number; address: string }> {
    return [
      {
        name: 'Gilgit City Center',
        latitude: 35.9208,
        longitude: 74.3144,
        address: 'Gilgit City Center'
      },
      {
        name: 'Gilgit Airport',
        latitude: 35.9250,
        longitude: 74.3200,
        address: 'Gilgit Airport'
      },
      {
        name: 'Gilgit University',
        latitude: 35.9180,
        longitude: 74.3120,
        address: 'Gilgit University'
      },
      {
        name: 'Gilgit Market',
        latitude: 35.9220,
        longitude: 74.3160,
        address: 'Gilgit Market'
      },
      {
        name: 'Gilgit Hospital',
        latitude: 35.9210,
        longitude: 74.3150,
        address: 'Gilgit Hospital'
      },
      {
        name: 'Gilgit Bus Terminal',
        latitude: 35.9190,
        longitude: 74.3130,
        address: 'Gilgit Bus Terminal'
      },
      {
        name: 'Gilgit Police Station',
        latitude: 35.9200,
        longitude: 74.3140,
        address: 'Gilgit Police Station'
      },
      {
        name: 'Gilgit Post Office',
        latitude: 35.9215,
        longitude: 74.3155,
        address: 'Gilgit Post Office'
      }
    ];
  }

  // Get nearest popular place to current location
  static getNearestPopularPlace(latitude: number, longitude: number): { name: string; address: string } {
    const popularPlaces = this.getPopularPlaces();
    let nearestPlace = popularPlaces[0];
    let shortestDistance = this.calculateDistance(latitude, longitude, nearestPlace.latitude, nearestPlace.longitude);

    for (const place of popularPlaces) {
      const distance = this.calculateDistance(latitude, longitude, place.latitude, place.longitude);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestPlace = place;
      }
    }

    // If within 1km of a popular place, use that name
    if (shortestDistance <= 1) {
      return { name: nearestPlace.name, address: nearestPlace.address };
    }

    return { name: 'Current Location', address: 'Current Location' };
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
