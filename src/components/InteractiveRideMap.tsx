import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform, Alert } from 'react-native';
import { Surface, FAB, Text } from 'react-native-paper';
// Only import MapView on mobile platforms
let MapView: any = null;
let PROVIDER_GOOGLE: any = null;
let PROVIDER_DEFAULT: any = null;
let Marker: any = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  PROVIDER_DEFAULT = Maps.PROVIDER_DEFAULT;
  Marker = Maps.Marker;
}
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LocationService } from '../services/LocationService';
import { GoogleMapsService } from '../services/GoogleMapsService';
import { GOOGLE_MAPS_CONFIG } from '../config/api';
import { MapFallback } from './MapFallback';
import { TransportMode } from './TransportModeSelector';

const { width, height } = Dimensions.get('window');

interface InteractiveRideMapProps {
  onLocationChange: (location: { latitude: number; longitude: number; address: string }) => void;
  onSubmit: () => void;
  showSubmitButton?: boolean;
  selectedTransportMode?: TransportMode | null;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  isFullscreen?: boolean;
}

const InteractiveRideMap: React.FC<InteractiveRideMapProps> = ({
  onLocationChange,
  onSubmit,
  showSubmitButton = true,
  selectedTransportMode,
  onInteractionStart,
  onInteractionEnd,
  isFullscreen,
}) => {
  const { theme } = useTheme();
  const mapRef = useRef<MapView>(null);
  const locationSelectTimeout = useRef<NodeJS.Timeout | null>(null);
  const popupTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const [region, setRegion] = useState<Region>({
    latitude: 35.9208, // Gilgit coordinates as fallback
    longitude: 74.3144,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const [destinationMarker, setDestinationMarker] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  
  const [isPinMoving, setIsPinMoving] = useState<boolean>(false);
  const [showPickupPopup, setShowPickupPopup] = useState<boolean>(true);
  const [currentPinLocation, setCurrentPinLocation] = useState<string>('Shahr-e-Quaid-e-Azam');
  const [mapError, setMapError] = useState<boolean>(false);
  const [mapProvider, setMapProvider] = useState<string | undefined>(
    PROVIDER_GOOGLE // Use Google Maps provider for both platforms
  );
  const [retryCount, setRetryCount] = useState(0);
  const [isMapLoading, setIsMapLoading] = useState<boolean>(true);
  const mapLoadingTimeout = useRef<NodeJS.Timeout | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasMovedRef = useRef<boolean>(false);

  useEffect(() => {
    getCurrentLocation();
    
    // Debug map region
    console.log('📍 Map region set to:', region);
    console.log('📍 Platform:', Platform.OS);
    console.log('📍 Map provider:', mapProvider);
    console.log('📍 Google Maps API Key:', GOOGLE_MAPS_CONFIG.API_KEY);
    
    // Set timeout for map loading
    mapLoadingTimeout.current = setTimeout(() => {
      if (isMapLoading) {
        console.warn('⏰ Map loading timeout - switching to fallback');
        console.warn('⏰ Platform:', Platform.OS);
        console.warn('⏰ Provider:', mapProvider);
        setIsMapLoading(false);
        setMapError(true);
      }
    }, 10000); // 10 second timeout
    
    // Cleanup timeout on unmount
    return () => {
      if (locationSelectTimeout.current) {
        clearTimeout(locationSelectTimeout.current);
      }
      if (mapLoadingTimeout.current) {
        clearTimeout(mapLoadingTimeout.current);
      }
      if (popupTimeout.current) {
        clearTimeout(popupTimeout.current);
      }
    };
  }, []);

  // Update region when current location changes
  useEffect(() => {
    if (currentLocation) {
      const newRegion = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    }
  }, [currentLocation]);

  useEffect(() => {
    console.log('📍 Region changed:', region);
  }, [region]);

  const getCurrentLocation = async () => {
    try {
      console.log('📍 InteractiveRideMap: Getting current location...');
      const location = await LocationService.getCurrentLocation();
      const coords = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
      
      console.log('📍 InteractiveRideMap: Current location:', coords);
      
      setCurrentLocation(coords);
      
      // Center map on current location
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setRegion(newRegion);
      
      // Add delay to ensure map is ready
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ InteractiveRideMap: Error getting current location:', error);
      
      // Show more specific error message
      let errorMessage = 'Unable to get your current location.';
      
      if (error.message.includes('permission denied')) {
        errorMessage = 'Location permission denied. Please enable location permissions in your device settings.';
      } else if (error.message.includes('disabled')) {
        errorMessage = 'Location services are disabled. Please enable location services in your device settings.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Location request timed out. Please try again.';
      }
      
      Alert.alert(
        'Location Error',
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => getCurrentLocation(),
          },
          {
            text: 'Use Default',
            onPress: () => {
              // Use default Gilgit location
              const defaultLocation = {
                latitude: 35.9208,
                longitude: 74.3144,
              };
              setCurrentLocation(defaultLocation);
              
              const fallbackRegion = {
                ...defaultLocation,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              };
              setRegion(fallbackRegion);
              
              setTimeout(() => {
                if (mapRef.current) {
                  mapRef.current.animateToRegion(fallbackRegion, 1000);
                }
              }, 500);
            },
          },
        ]
      );
    }
  };

  const handleRegionChange = (newRegion: Region) => {
    // User is actively moving the pin
    setIsPinMoving(true);
    setShowPickupPopup(false);
    if (onInteractionStart) {
      onInteractionStart();
    }
    hasMovedRef.current = true;
    
    // Clear any existing popup timeout
    if (popupTimeout.current) {
      clearTimeout(popupTimeout.current);
    }
  };

  const handleRegionChangeComplete = async (newRegion: Region) => {
    setRegion(newRegion);
    
    // Clear any existing popup timeout
    if (popupTimeout.current) {
      clearTimeout(popupTimeout.current);
    }
    
    // Pin is now at rest - show popup after a delay
    popupTimeout.current = setTimeout(() => {
      setIsPinMoving(false);
      setShowPickupPopup(true);
      if (onInteractionEnd) {
        onInteractionEnd();
      }
    }, 500); // Delay to prevent flickering
    
    // Debounce to prevent excessive API calls
    if (locationSelectTimeout.current) {
      clearTimeout(locationSelectTimeout.current);
    }
    
    locationSelectTimeout.current = setTimeout(async () => {
      // The center of the map is the selected destination
      const centerCoordinate = {
        latitude: newRegion.latitude,
        longitude: newRegion.longitude,
      };
      
      await handleLocationSelect(centerCoordinate);
    }, 500); // Wait 500ms after user stops moving map
  };

  const handleLocationSelect = async (coordinate: { latitude: number; longitude: number }) => {
    try {
      // Get address for the coordinate
      const address = await GoogleMapsService.reverseGeocode(
        coordinate.latitude,
        coordinate.longitude
      );
      
      const finalLocation = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: address,
      };
      
      setDestinationMarker(finalLocation);
      setCurrentPinLocation(address); // Update the location under the pin
      onLocationChange(finalLocation);
    } catch (error) {
      console.error('Error getting address:', error);
      const fallbackAddress = `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`;
      const fallbackLocation = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: fallbackAddress,
      };
      
      setDestinationMarker(fallbackLocation);
      setCurrentPinLocation(fallbackAddress); // Update the location under the pin
      onLocationChange(fallbackLocation);
    }
  };

  const centerOnCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      const newRegion = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  };

  const handleMapError = (error: any) => {
    console.error('🗺️ Map error:', error);
    console.error('🗺️ Map error details:', JSON.stringify(error, null, 2));
    console.error('🗺️ Platform:', Platform.OS);
    console.error('🗺️ Map provider:', mapProvider);
    console.warn('Showing fallback UI due to map error');
    setMapError(true);
  };

  const retryMap = () => {
    console.log('🔄 Retrying map with different provider...');
    setRetryCount(prev => prev + 1);
    
    // Try different providers on retry
    if (retryCount === 0) {
      console.log('🔄 Trying PROVIDER_DEFAULT...');
      setMapProvider(PROVIDER_DEFAULT);
    } else if (retryCount === 1) {
      console.log('🔄 Trying PROVIDER_GOOGLE again...');
      setMapProvider(PROVIDER_GOOGLE);
    }
    
    setMapError(false);
    setIsMapLoading(true);
  };

  // Web fallback
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Surface style={[styles.map, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontSize: 16, color: '#666' }}>
            Map is not available on web platform
          </Text>
        </Surface>
      </View>
    );
  }

  if (mapError) {
    return (
      <MapFallback 
        onRetry={retryMap}
        message="Map failed to load"
      />
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={mapProvider}
        style={styles.map}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
        onTouchStart={() => {
          hasMovedRef.current = false;
          if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
          }
          holdTimerRef.current = setTimeout(() => {
            if (onInteractionStart) {
              onInteractionStart();
            }
          }, 120);
        }}
        onTouchEnd={() => {
          if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
          }
          if (!isPinMoving && onInteractionEnd) {
            onInteractionEnd();
          }
        }}
        onPanDrag={() => {
          if (onInteractionStart) {
            onInteractionStart();
          }
          hasMovedRef.current = true;
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        mapType="standard"
        pitchEnabled={true}
        rotateEnabled={true}
        showsBuildings={true}
        showsPointsOfInterest={true}
        camera={{
          center: {
            latitude: currentLocation?.latitude || 35.9208,
            longitude: currentLocation?.longitude || 74.3144,
          },
          pitch: 0,
          heading: 0,
          altitude: 2000,
          zoom: 15,
        }}
        onError={handleMapError}
        onMapReady={() => {
          console.log('📍 Map is ready');
          console.log('📍 Platform:', Platform.OS);
          console.log('📍 Map provider:', mapProvider);
          console.log('📍 Region:', region);
          setIsMapLoading(false);
          if (mapLoadingTimeout.current) {
            clearTimeout(mapLoadingTimeout.current);
          }
        }}
        onPress={() => console.log('📍 Map pressed')}
        loadingEnabled={false}
      >
        {/* Current Location Marker (Solid Blue Circle) */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.currentLocationMarker} />
          </Marker>
        )}
      </MapView>

      {/* Location Display Above Pin - Speech Bubble Style */}
      {currentLocation && showPickupPopup && !isPinMoving && (
        <View style={styles.pickupBubbleContainer}>
          <View style={styles.pickupBubble}>
            <Text style={styles.pickupBubbleText}>{currentPinLocation}</Text>
          </View>
          <View style={styles.pickupBubbleTail} />
        </View>
      )}

      {/* Fixed Center Marker (Destination Selection Pin) */}
      <View style={[
        styles.centerMarkerContainer,
        { marginTop: -20 },
      ]}>
        <View style={styles.centerMarker}>
          <View style={styles.markerPin}>
            <View style={styles.markerPinInner} />
          </View>
          <View style={styles.markerShadow} />
        </View>
      </View>


      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {/* My Location Button */}
        <FAB
          icon="crosshairs-gps"
          size="small"
          onPress={centerOnCurrentLocation}
          style={[styles.fab, { backgroundColor: theme.colors.surface }]}
        />

      </View>

      {/* Transport Mode Display */}
      {selectedTransportMode && (
        <Surface style={[styles.transportModeCard, { backgroundColor: theme.colors.surface }]} elevation={3}>
          <View style={styles.transportModeContent}>
            <View style={[styles.transportModeIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name={selectedTransportMode.icon} size={20} color="white" />
            </View>
            <View style={styles.transportModeText}>
              <Text style={[styles.transportModeName, { color: theme.colors.onSurface }]}>
                {selectedTransportMode.name}
              </Text>
              <Text style={[styles.transportModeCapacity, { color: theme.colors.onSurfaceVariant }]}>
                {selectedTransportMode.capacity} passengers
              </Text>
            </View>
            <Text style={[styles.transportModePrice, { color: theme.colors.primary }]}>
              PKR {selectedTransportMode.basePrice}
            </Text>
          </View>
        </Surface>
      )}

      {/* Instructions */}
      {!destinationMarker && (
        <Surface style={[styles.instructionCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={2}>
          <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, textAlign: 'center' }}>
            Drag the map to select your destination
          </Text>
        </Surface>
      )}

      {/* Removed 'Move the map to adjust your destination' label for a cleaner UI */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    gap: 12,
  },
  fab: {
    borderRadius: 28,
  },
  submitFab: {
    borderRadius: 32,
  },
  transportModeCard: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  transportModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transportModeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transportModeText: {
    flex: 1,
  },
  transportModeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transportModeCapacity: {
    fontSize: 12,
    opacity: 0.7,
  },
  transportModePrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionCard: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  centerMarkerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
    zIndex: 1000,
  },
  centerMarker: {
    alignItems: 'center',
  },
  markerPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  markerPinInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  markerShadow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginTop: 2,
  },
  currentLocationMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pickupBubbleContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -150, // Position above the center pin (which is now above current location)
    marginLeft: -80, // Center horizontally
    alignItems: 'center',
    zIndex: 1001,
  },
  pickupBubble: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pickupBubbleText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  pickupBubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#2196F3',
    marginTop: -1,
  },
});

export default InteractiveRideMap;
