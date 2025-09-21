import { GOOGLE_MAPS_CONFIG, GOOGLE_API_ENDPOINTS } from '../config/api';
import { LocationService } from './LocationService';
import { showGoogleMapsBillingAlert } from '../components/GoogleMapsAlert';

export interface DirectionsResult {
  distance: {
    text: string;
    value: number; // in meters
  };
  duration: {
    text: string;
    value: number; // in seconds
  };
  polyline: string;
  steps: DirectionStep[];
}

export interface DirectionStep {
  instructions: string;
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  start_location: { lat: number; lng: number };
  end_location: { lat: number; lng: number };
}

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  rating?: number;
  types: string[];
}

export interface AutocompletePrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface DistanceMatrixResult {
  origin: string;
  destination: string;
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  status: string;
}

export class GoogleMapsService {
  private static billingDisabled = false; // Track if billing is disabled
  
  /**
   * Get route coordinates for map display
   */
  static async getRoute(
    origin: [number, number],
    destination: [number, number]
  ): Promise<Array<{ latitude: number; longitude: number }>> {
    try {
      console.log('🗺️ GoogleMapsService.getRoute called with:', {
        origin,
        destination,
        originFormatted: { latitude: origin[1], longitude: origin[0] },
        destinationFormatted: { latitude: destination[1], longitude: destination[0] }
      });
      
      const directions = await this.getDirections(
        { latitude: origin[1], longitude: origin[0] },
        { latitude: destination[1], longitude: destination[0] }
      );
      
      console.log('🗺️ Directions received:', {
        polyline: directions.polyline?.substring(0, 50) + '...',
        distance: directions.distance,
        duration: directions.duration
      });
      
      return this.decodePolyline(directions.polyline);
    } catch (error) {
      console.error('❌ Error getting route:', error);
      // Return a simple straight line as fallback
      const fallback = [
        { latitude: origin[1], longitude: origin[0] },
        { latitude: destination[1], longitude: destination[0] }
      ];
      console.log('🗺️ Using fallback route:', fallback);
      return fallback;
    }
  }

  /**
   * Get directions between two points
   */
  static async getDirections(
    origin: { latitude: number; longitude: number } | string,
    destination: { latitude: number; longitude: number } | string
  ): Promise<DirectionsResult> {
    // If billing is disabled, throw error immediately
    if (this.billingDisabled) {
      throw new Error('Google Maps API billing is disabled');
    }
    
    try {
      const originStr = typeof origin === 'string' 
        ? origin 
        : `${origin.latitude},${origin.longitude}`;
      
      const destinationStr = typeof destination === 'string' 
        ? destination 
        : `${destination.latitude},${destination.longitude}`;

      const url = GOOGLE_API_ENDPOINTS.directions(originStr, destinationStr);
      
      console.log('🗺️ Getting directions from:', originStr, 'to:', destinationStr);
      console.log('🗺️ Full API URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();

      console.log('🗺️ API Response status:', data.status);
      if (data.status !== 'OK') {
        console.log('🗺️ API Response data:', data);
      }

      if (data.status === 'REQUEST_DENIED') {
        console.warn('⚠️ Google Maps Directions API REQUEST_DENIED. Disabling further API calls.');
        this.billingDisabled = true;
        throw new Error(`Directions API error: ${data.status}`);
      }
      
      if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        throw new Error(`Directions API error: ${data.status}`);
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      return {
        distance: leg.distance,
        duration: leg.duration,
        polyline: route.overview_polyline.points,
        steps: leg.steps,
      };
    } catch (error) {
      console.error('❌ Error getting directions:', error);
      throw error;
    }
  }

  /**
   * Geocode an address to get coordinates
   */
  static async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    try {
      const url = GOOGLE_API_ENDPOINTS.geocoding(address);
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        throw new Error(`Geocoding failed: ${data.status}`);
      }

      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } catch (error) {
      console.error('❌ Error geocoding address:', error);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    // If billing is disabled, use device geocoder fallback for a nicer place name
    if (this.billingDisabled) {
      try {
        return await LocationService.getAddressFromCoordinates(latitude, longitude);
      } catch (_) {
        return `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    }
    
    try {
      const url = GOOGLE_API_ENDPOINTS.reverseGeocoding(latitude, longitude);
      console.log('🗺️ Reverse geocoding URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('🗺️ Reverse geocoding response:', data);

      if (data.status === 'REQUEST_DENIED') {
        console.warn('⚠️ Google Maps API REQUEST_DENIED. Disabling further API calls until restart.');
        this.billingDisabled = true; // Disable further calls
        showGoogleMapsBillingAlert(); // Show user-friendly alert
        try {
          return await LocationService.getAddressFromCoordinates(latitude, longitude);
        } catch (_) {
          return `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }
      }

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        console.warn('⚠️ Reverse geocoding failed, using device geocoder as fallback');
        try {
          return await LocationService.getAddressFromCoordinates(latitude, longitude);
        } catch (_) {
          return `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }
      }

      const formatted = data.results[0].formatted_address as string;
      // Prefer shorter names when possible
      return formatted;
    } catch (error) {
      console.error('❌ Error reverse geocoding:', error);
      try {
        return await LocationService.getAddressFromCoordinates(latitude, longitude);
      } catch (_) {
        return `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    }
  }

  /**
   * Find nearby places
   */
  static async findNearbyPlaces(
    latitude: number, 
    longitude: number, 
    radius: number = 1000,
    type?: string
  ): Promise<PlaceResult[]> {
    try {
      let url = GOOGLE_API_ENDPOINTS.places(latitude, longitude, radius);
      
      if (type) {
        url += `&type=${type}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Places API error: ${data.status}`);
      }

      return data.results || [];
    } catch (error) {
      console.error('❌ Error finding nearby places:', error);
      throw error;
    }
  }

  /**
   * Get place autocomplete suggestions
   */
  static async getPlaceAutocomplete(
    input: string,
    location?: { latitude: number; longitude: number },
    radius?: number
  ): Promise<AutocompletePrediction[]> {
    // If billing is disabled, return mock suggestions
    if (this.billingDisabled) {
      return this.getMockSuggestions(input);
    }

    try {
      // Use Gilgit city coordinates for location bias
      const gilgitLocation = {
        lat: 35.9208,
        lng: 74.3144,
      };
      
      const url = GOOGLE_API_ENDPOINTS.placeAutocomplete(
        input,
        gilgitLocation,
        50000 // 50km radius around Gilgit
      );

      console.log('🔍 Getting place autocomplete for:', input, 'in Gilgit area');
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'REQUEST_DENIED') {
        console.warn('⚠️ Google Places Autocomplete API REQUEST_DENIED. Using mock suggestions.');
        this.billingDisabled = true;
        return this.getMockSuggestions(input);
      }

      if (data.status !== 'OK') {
        console.warn('⚠️ Places Autocomplete API error:', data.status);
        return this.getMockSuggestions(input);
      }

      // Filter results to only include places in Gilgit-Baltistan
      const filteredPredictions = (data.predictions || []).filter((prediction: any) => {
        const description = prediction.description.toLowerCase();
        return description.includes('gilgit-baltistan') ||
               (description.includes('gilgit') && description.includes('baltistan')) ||
               description.includes('gilgit, gilgit-baltistan');
      });

      return filteredPredictions;
    } catch (error) {
      console.error('❌ Error getting place autocomplete:', error);
      return this.getMockSuggestions(input);
    }
  }

  /**
   * Get place details by place ID
   */
  static async getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
    try {
      const url = GOOGLE_API_ENDPOINTS.placeDetails(placeId);
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' || !data.result) {
        throw new Error(`Place details error: ${data.status}`);
      }

      return {
        place_id: data.result.place_id,
        name: data.result.name,
        formatted_address: data.result.formatted_address,
        geometry: data.result.geometry,
        types: data.result.types || [],
      };
    } catch (error) {
      console.error('❌ Error getting place details:', error);
      return null;
    }
  }

  /**
   * Get mock suggestions for fallback
   */
  private static getMockSuggestions(input: string): AutocompletePrediction[] {
    const mockSuggestions: AutocompletePrediction[] = [
      {
        place_id: '1',
        description: 'Gilgit City Center, Gilgit, Gilgit-Baltistan',
        main_text: 'Gilgit City Center',
        secondary_text: 'Gilgit, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Gilgit City Center',
          secondary_text: 'Gilgit, Gilgit-Baltistan',
        },
      },
      {
        place_id: '2',
        description: 'Gilgit Airport, Gilgit, Gilgit-Baltistan',
        main_text: 'Gilgit Airport',
        secondary_text: 'Gilgit, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Gilgit Airport',
          secondary_text: 'Gilgit, Gilgit-Baltistan',
        },
      },
      {
        place_id: '3',
        description: 'Gilgit Bazaar, Gilgit, Gilgit-Baltistan',
        main_text: 'Gilgit Bazaar',
        secondary_text: 'Gilgit, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Gilgit Bazaar',
          secondary_text: 'Gilgit, Gilgit-Baltistan',
        },
      },
      {
        place_id: '4',
        description: 'Karakoram Highway, Gilgit, Gilgit-Baltistan',
        main_text: 'Karakoram Highway',
        secondary_text: 'Gilgit, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Karakoram Highway',
          secondary_text: 'Gilgit, Gilgit-Baltistan',
        },
      },
      {
        place_id: '5',
        description: 'Gilgit University, Gilgit, Gilgit-Baltistan',
        main_text: 'Gilgit University',
        secondary_text: 'Gilgit, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Gilgit University',
          secondary_text: 'Gilgit, Gilgit-Baltistan',
        },
      },
      {
        place_id: '6',
        description: 'Gilgit Hospital, Gilgit, Gilgit-Baltistan',
        main_text: 'Gilgit Hospital',
        secondary_text: 'Gilgit, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Gilgit Hospital',
          secondary_text: 'Gilgit, Gilgit-Baltistan',
        },
      },
      {
        place_id: '7',
        description: 'Shahr-e-Quaid-e-Azam, Gilgit, Gilgit-Baltistan',
        main_text: 'Shahr-e-Quaid-e-Azam',
        secondary_text: 'Gilgit, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Shahr-e-Quaid-e-Azam',
          secondary_text: 'Gilgit, Gilgit-Baltistan',
        },
      },
      {
        place_id: '8',
        description: 'Ali a.s Mosque, Gilgit, Gilgit-Baltistan',
        main_text: 'Ali a.s Mosque',
        secondary_text: 'Gilgit, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Ali a.s Mosque',
          secondary_text: 'Gilgit, Gilgit-Baltistan',
        },
      },
      {
        place_id: '9',
        description: 'Skardu Airport, Skardu, Gilgit-Baltistan',
        main_text: 'Skardu Airport',
        secondary_text: 'Skardu, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Skardu Airport',
          secondary_text: 'Skardu, Gilgit-Baltistan',
        },
      },
      {
        place_id: '10',
        description: 'Hunza Valley, Hunza, Gilgit-Baltistan',
        main_text: 'Hunza Valley',
        secondary_text: 'Hunza, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Hunza Valley',
          secondary_text: 'Hunza, Gilgit-Baltistan',
        },
      },
      {
        place_id: '11',
        description: 'Astore, Astore, Gilgit-Baltistan',
        main_text: 'Astore',
        secondary_text: 'Astore, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Astore',
          secondary_text: 'Astore, Gilgit-Baltistan',
        },
      },
      {
        place_id: '12',
        description: 'Baltit Fort, Hunza, Gilgit-Baltistan',
        main_text: 'Baltit Fort',
        secondary_text: 'Hunza, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Baltit Fort',
          secondary_text: 'Hunza, Gilgit-Baltistan',
        },
      },
      {
        place_id: '13',
        description: 'Chitral, Chitral, Gilgit-Baltistan',
        main_text: 'Chitral',
        secondary_text: 'Chitral, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Chitral',
          secondary_text: 'Chitral, Gilgit-Baltistan',
        },
      },
      {
        place_id: '14',
        description: 'Diamer, Diamer, Gilgit-Baltistan',
        main_text: 'Diamer',
        secondary_text: 'Diamer, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Diamer',
          secondary_text: 'Diamer, Gilgit-Baltistan',
        },
      },
      {
        place_id: '15',
        description: 'Ghizer, Ghizer, Gilgit-Baltistan',
        main_text: 'Ghizer',
        secondary_text: 'Ghizer, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Ghizer',
          secondary_text: 'Ghizer, Gilgit-Baltistan',
        },
      },
      {
        place_id: '16',
        description: 'Gupis, Gupis, Gilgit-Baltistan',
        main_text: 'Gupis',
        secondary_text: 'Gupis, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Gupis',
          secondary_text: 'Gupis, Gilgit-Baltistan',
        },
      },
      {
        place_id: '17',
        description: 'Hunza, Hunza, Gilgit-Baltistan',
        main_text: 'Hunza',
        secondary_text: 'Hunza, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Hunza',
          secondary_text: 'Hunza, Gilgit-Baltistan',
        },
      },
      {
        place_id: '18',
        description: 'Ishkoman, Ishkoman, Gilgit-Baltistan',
        main_text: 'Ishkoman',
        secondary_text: 'Ishkoman, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Ishkoman',
          secondary_text: 'Ishkoman, Gilgit-Baltistan',
        },
      },
      {
        place_id: '19',
        description: 'Jaglot, Jaglot, Gilgit-Baltistan',
        main_text: 'Jaglot',
        secondary_text: 'Jaglot, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Jaglot',
          secondary_text: 'Jaglot, Gilgit-Baltistan',
        },
      },
      {
        place_id: '20',
        description: 'Khaplu, Khaplu, Gilgit-Baltistan',
        main_text: 'Khaplu',
        secondary_text: 'Khaplu, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Khaplu',
          secondary_text: 'Khaplu, Gilgit-Baltistan',
        },
      },
      {
        place_id: '21',
        description: 'Minimarg, Minimarg, Gilgit-Baltistan',
        main_text: 'Minimarg',
        secondary_text: 'Minimarg, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Minimarg',
          secondary_text: 'Minimarg, Gilgit-Baltistan',
        },
      },
      {
        place_id: '22',
        description: 'Nagar, Nagar, Gilgit-Baltistan',
        main_text: 'Nagar',
        secondary_text: 'Nagar, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Nagar',
          secondary_text: 'Nagar, Gilgit-Baltistan',
        },
      },
      {
        place_id: '23',
        description: 'Passu, Passu, Gilgit-Baltistan',
        main_text: 'Passu',
        secondary_text: 'Passu, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Passu',
          secondary_text: 'Passu, Gilgit-Baltistan',
        },
      },
      {
        place_id: '24',
        description: 'Rakaposhi, Rakaposhi, Gilgit-Baltistan',
        main_text: 'Rakaposhi',
        secondary_text: 'Rakaposhi, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Rakaposhi',
          secondary_text: 'Rakaposhi, Gilgit-Baltistan',
        },
      },
      {
        place_id: '25',
        description: 'Shigar, Shigar, Gilgit-Baltistan',
        main_text: 'Shigar',
        secondary_text: 'Shigar, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Shigar',
          secondary_text: 'Shigar, Gilgit-Baltistan',
        },
      },
      {
        place_id: '26',
        description: 'Skardu, Skardu, Gilgit-Baltistan',
        main_text: 'Skardu',
        secondary_text: 'Skardu, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Skardu',
          secondary_text: 'Skardu, Gilgit-Baltistan',
        },
      },
      {
        place_id: '27',
        description: 'Tashkurgan, Tashkurgan, Gilgit-Baltistan',
        main_text: 'Tashkurgan',
        secondary_text: 'Tashkurgan, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Tashkurgan',
          secondary_text: 'Tashkurgan, Gilgit-Baltistan',
        },
      },
      {
        place_id: '28',
        description: 'Yasin, Yasin, Gilgit-Baltistan',
        main_text: 'Yasin',
        secondary_text: 'Yasin, Gilgit-Baltistan',
        structured_formatting: {
          main_text: 'Yasin',
          secondary_text: 'Yasin, Gilgit-Baltistan',
        },
      },
    ];

    return mockSuggestions.filter(suggestion => 
      suggestion.description.toLowerCase().includes(input.toLowerCase()) ||
      suggestion.main_text.toLowerCase().includes(input.toLowerCase())
    );
  }

  /**
   * Calculate distance matrix between multiple origins and destinations
   */
  static async getDistanceMatrix(
    origins: Array<{ latitude: number; longitude: number }>,
    destinations: Array<{ latitude: number; longitude: number }>
  ): Promise<DistanceMatrixResult[]> {
    try {
      const originStrings = origins.map(o => `${o.latitude},${o.longitude}`);
      const destinationStrings = destinations.map(d => `${d.latitude},${d.longitude}`);
      
      const url = GOOGLE_API_ENDPOINTS.distanceMatrix(originStrings, destinationStrings);
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Distance Matrix API error: ${data.status}`);
      }

      const results: DistanceMatrixResult[] = [];
      
      for (let i = 0; i < data.rows.length; i++) {
        for (let j = 0; j < data.rows[i].elements.length; j++) {
          const element = data.rows[i].elements[j];
          results.push({
            origin: originStrings[i],
            destination: destinationStrings[j],
            distance: element.distance,
            duration: element.duration,
            status: element.status,
          });
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Error getting distance matrix:', error);
      throw error;
    }
  }

  /**
   * Find drivers within radius of passenger location
   */
  static async findNearbyDrivers(
    passengerLocation: { latitude: number; longitude: number },
    driverLocations: Array<{ id: string; latitude: number; longitude: number }>,
    radiusKm: number = GOOGLE_MAPS_CONFIG.DRIVER_SEARCH_RADIUS
  ): Promise<Array<{ id: string; distance: number; duration: number }>> {
    try {
      // Filter drivers by approximate distance first (faster)
      const nearbyDrivers = driverLocations.filter(driver => {
        const distance = this.calculateHaversineDistance(
          passengerLocation.latitude,
          passengerLocation.longitude,
          driver.latitude,
          driver.longitude
        );
        return distance <= radiusKm;
      });

      if (nearbyDrivers.length === 0) {
        return [];
      }

      // Get precise distances using Google's Distance Matrix API
      const distanceMatrix = await this.getDistanceMatrix(
        [passengerLocation],
        nearbyDrivers.map(d => ({ latitude: d.latitude, longitude: d.longitude }))
      );

      const results = [];
      for (let i = 0; i < nearbyDrivers.length; i++) {
        const matrix = distanceMatrix[i];
        if (matrix.status === 'OK' && matrix.distance.value <= radiusKm * 1000) {
          results.push({
            id: nearbyDrivers[i].id,
            distance: matrix.distance.value / 1000, // Convert to km
            duration: matrix.duration.value / 60, // Convert to minutes
          });
        }
      }

      // Sort by distance
      return results.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('❌ Error finding nearby drivers:', error);
      throw error;
    }
  }

  /**
   * Calculate Haversine distance between two points (quick approximation)
   */
  static calculateHaversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Decode polyline string to array of coordinates
   */
  static decodePolyline(encoded: string): Array<{ latitude: number; longitude: number }> {
    const poly = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return poly;
  }
}
