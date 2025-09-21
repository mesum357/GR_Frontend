import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Text, Surface, FAB } from 'react-native-paper';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GoogleMapsService } from '../services/GoogleMapsService';
import { LocationService } from '../services/LocationService';

const { width, height } = Dimensions.get('window');

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

interface DestinationMapModalProps {
  visible: boolean;
  onClose: () => void;
  onDone?: (destination: LocationData) => void;
  onDestinationSelected?: (destination: LocationData) => void;
  onFindDriver?: (destination: LocationData) => void;
  fromLocation?: any;
  fromCoordinates?: { latitude: number; longitude: number };
  selectedTransportMode?: any;
}

const DestinationMapModal: React.FC<DestinationMapModalProps> = ({
  visible,
  onClose,
  onDone,
  onDestinationSelected,
  onFindDriver,
  fromLocation,
  fromCoordinates,
  selectedTransportMode,
}) => {
  const { theme } = useTheme();
  const mapRef = useRef<MapView>(null);
  const locationSelectTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const [region, setRegion] = useState<Region>({
    latitude: 35.9208,
    longitude: 74.3144,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [destinationMarker, setDestinationMarker] = useState<LocationData | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{latitude: number; longitude: number}>>([]);
  const [showRoute, setShowRoute] = useState(false);
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isPinMoving, setIsPinMoving] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  useEffect(() => {
    if (visible && !hasInitialized) {
      getCurrentLocation();
      setHasInitialized(true);
    } else if (!visible) {
      setHasInitialized(false);
      // Reset state when modal closes
      setDestinationMarker(null);
      setRouteCoordinates([]);
      setShowRoute(false);
      setIsPinMoving(false);
      setUserHasInteracted(false);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (locationSelectTimeout.current) {
        clearTimeout(locationSelectTimeout.current);
      }
    };
  }, [visible, hasInitialized]);

  // Only set region to current location on initial load, not on every currentLocation change
  useEffect(() => {
    if (currentLocation && !hasInitialized) {
      const newRegion = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      
      // For iOS, add a small delay to ensure map is ready
      if (Platform.OS === 'ios') {
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
          }
        }, 300);
      } else {
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      }
    }
  }, [currentLocation, hasInitialized]);

  const getCurrentLocation = async () => {
    try {
      console.log('📍 DestinationMapModal: Getting current location...');
      const location = await LocationService.getCurrentLocation();
      
      if (location) {
        console.log('📍 DestinationMapModal: Current location:', location);
        setCurrentLocation(location);
      }
    } catch (error) {
      console.error('❌ DestinationMapModal: Error getting current location:', error);
      
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
              // Use fromCoordinates if available, otherwise use default Gilgit location
              if (fromCoordinates) {
                setCurrentLocation(fromCoordinates);
                const fallbackRegion = {
                  ...fromCoordinates,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                };
                setRegion(fallbackRegion);
                setTimeout(() => {
                  if (mapRef.current) {
                    mapRef.current.animateToRegion(fallbackRegion, 1000);
                  }
                }, 300);
              } else {
                // Fallback to Gilgit location
                const fallbackRegion = {
                  latitude: 35.9208,
                  longitude: 74.3144,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                };
                setRegion(fallbackRegion);
                setTimeout(() => {
                  if (mapRef.current) {
                    mapRef.current.animateToRegion(fallbackRegion, 1000);
                  }
                }, 300);
              }
            },
          },
        ]
      );
    }
  };

  const handleRegionChange = (newRegion: Region) => {
    // User is actively moving the map/pin
    setIsPinMoving(true);
    setUserHasInteracted(true);
  };

  const handleRegionChangeComplete = async (newRegion: Region) => {
    setRegion(newRegion);
    setIsPinMoving(false);
    
    // Don't automatically update destination on region change
    // Only allow manual selection via tap
    return;
  };

  const handleMapPress = async (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    setUserHasInteracted(true);
    await handleLocationSelect(coordinate);
  };

  const handleLocationSelect = async (coordinate: { latitude: number; longitude: number }) => {
    try {
      // Get address for the coordinate
      const address = await GoogleMapsService.reverseGeocode(
        coordinate.latitude,
        coordinate.longitude
      );
      
      const destination: LocationData = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: address,
      };
      
      setDestinationMarker(destination);
      console.log('📍 Destination selected on map:', address);
      
      // Get route if we have both pickup and destination
      if (fromCoordinates) {
        await getRoute(fromCoordinates, coordinate);
      }
      
    } catch (error) {
      console.error('❌ Error getting address for selected location:', error);
    }
  };

  const getRoute = async (from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) => {
    try {
      console.log('🗺️ Getting directions from:', from.latitude + ',' + from.longitude, 'to:', to.latitude + ',' + to.longitude);
      
      const route = await GoogleMapsService.getDirections(from, to);
      
      if (route && route.coordinates) {
        setRouteCoordinates(route.coordinates);
        setShowRoute(true);
        console.log('🗺️ Route calculated successfully');
      }
    } catch (error) {
      console.error('❌ Error getting route:', error);
    }
  };

  const handleConfirmDestination = async () => {
    let destination = destinationMarker;
    
    // If no destination is selected, use the center of the map
    if (!destination) {
      try {
        // Get address for the center of the map
        const address = await GoogleMapsService.reverseGeocode(
          region.latitude,
          region.longitude
        );
        
        destination = {
          latitude: region.latitude,
          longitude: region.longitude,
          address: address,
        };
        
        console.log('📍 Using map center as destination:', address);
      } catch (error) {
        console.error('❌ Error getting address for map center:', error);
        // Use coordinates as fallback
        destination = {
          latitude: region.latitude,
          longitude: region.longitude,
          address: `${region.latitude.toFixed(6)}, ${region.longitude.toFixed(6)}`,
        };
      }
    }
    
    // Use onDone if available, otherwise fall back to onDestinationSelected
    const callback = onDone || onDestinationSelected;
    if (callback) {
      callback(destination);
    }
    onClose();
  };

  const handleMapReady = () => {
    console.log('📍 Destination Map - Map ready');
    setMapReady(true);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={4}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Choose destination
          </Text>
          <View style={styles.placeholder} />
        </Surface>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            onRegionChange={handleRegionChange}
            onRegionChangeComplete={handleRegionChangeComplete}
            onMapReady={handleMapReady}
            onPress={handleMapPress}
            mapType="standard"
            pitchEnabled={true}
            rotateEnabled={true}
            showsBuildings={true}
            showsPointsOfInterest={true}
            showsUserLocation={false}
            showsMyLocationButton={false}
            camera={{
              center: {
                latitude: ((fromCoordinates?.latitude || 35.9208) + (destinationMarker?.latitude || 35.9208)) / 2,
                longitude: ((fromCoordinates?.longitude || 74.3144) + (destinationMarker?.longitude || 74.3144)) / 2,
              },
              pitch: 0,
              heading: 0,
              altitude: 2000,
              zoom: 15,
            }}
          >
            {/* From Location Marker - Custom styled like InteractiveRideMap */}
            {fromCoordinates && (
              <Marker
                coordinate={fromCoordinates}
                title="Pickup Location"
                description="Your current location"
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.currentLocationMarker} />
              </Marker>
            )}

            {/* Route Polyline */}
            {showRoute && routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={4}
                strokeColor="#2196F3"
                lineDashPattern={[0]}
              />
            )}
          </MapView>

          {/* Fixed Center Marker - Destination Selection Pin (like InteractiveRideMap) */}
          <View style={styles.centerMarkerContainer}>
            <View style={styles.centerMarker}>
              <View style={styles.markerPin}>
                <View style={styles.markerPinInner} />
              </View>
              <View style={styles.markerShadow} />
            </View>
          </View>

          {/* Destination Info Card - Always visible */}
          <Surface style={[styles.destinationCard, { backgroundColor: theme.colors.surface }]} elevation={4}>
            <View style={styles.cardContent}>
              <View style={styles.destinationInfo}>
                <Ionicons name="location" size={20} color={theme.colors.primary} />
                <View style={styles.destinationText}>
                  <Text style={[styles.destinationTitle, { color: theme.colors.onSurface }]}>
                    {destinationMarker ? 'Destination' : 'Select Destination'}
                  </Text>
                  <Text style={[styles.destinationAddress, { color: theme.colors.onSurface }]}>
                    {destinationMarker ? destinationMarker.address : 'Tap on the map to select your destination'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.buttonContainer}>
                <FAB
                  label="Done"
                  style={[
                    styles.confirmButton, 
                    { 
                      backgroundColor: theme.colors.primary,
                      opacity: 1
                    }
                  ]}
                  onPress={handleConfirmDestination}
                />
                {onFindDriver && destinationMarker && (
                  <FAB
                    icon="car"
                    style={[styles.findDriverButton, { backgroundColor: theme.colors.secondary }]}
                    onPress={() => {
                      if (destinationMarker && onFindDriver) {
                        onFindDriver(destinationMarker);
                        onClose();
                      }
                    }}
                  />
                )}
              </View>
            </View>
          </Surface>

          {/* Instructions - Only show when no destination selected */}
          {!destinationMarker && !isPinMoving && (
            <Surface style={[styles.instructionCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={2}>
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, textAlign: 'center' }}>
                Tap on the map to select your destination
              </Text>
            </Surface>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: width,
    height: '100%',
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
  destinationCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  destinationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  destinationText: {
    marginLeft: 12,
    flex: 1,
  },
  destinationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 14,
    opacity: 0.7,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmButton: {
    marginLeft: 12,
  },
  findDriverButton: {
    marginLeft: 8,
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
});

export default DestinationMapModal;
