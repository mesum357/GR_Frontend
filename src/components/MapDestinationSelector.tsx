import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { Text, Surface, FAB, ActivityIndicator } from 'react-native-paper';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LocationService } from '../services/LocationService';
import { GoogleMapsService } from '../services/GoogleMapsService';
import { GOOGLE_MAPS_CONFIG } from '../config/api';

const { width, height } = Dimensions.get('window');

interface MapDestinationSelectorProps {
  onPickupLocationChange: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  onDestinationChange: (destination: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  initialRegion?: Region;
}

const MapDestinationSelector: React.FC<MapDestinationSelectorProps> = ({
  onPickupLocationChange,
  onDestinationChange,
  initialRegion,
}) => {
  const { theme } = useTheme();
  const mapRef = useRef<MapView>(null);
  
  const [region, setRegion] = useState<Region>(
    initialRegion || GOOGLE_MAPS_CONFIG.DEFAULT_REGION
  );
  
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  
  const [destinationLocation, setDestinationLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Get user's current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      console.log('📍 MapDestinationSelector: Getting current location...');
      const location = await LocationService.getCurrentLocation();
      const coords = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      };
      
      console.log('📍 MapDestinationSelector: Location received:', coords);
      
      setCurrentLocation(coords);
      onPickupLocationChange(coords);
      
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
      console.error('❌ MapDestinationSelector: Error getting current location:', error);
      
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
                address: 'Gilgit City Center',
              };
              setCurrentLocation(defaultLocation);
              onPickupLocationChange(defaultLocation);
              
              const newRegion = {
                latitude: defaultLocation.latitude,
                longitude: defaultLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              };
              setRegion(newRegion);
              
              if (mapRef.current) {
                mapRef.current.animateToRegion(newRegion, 1000);
              }
            },
          },
        ]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    
    // Set destination marker immediately for better UX
    setDestinationLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      address: 'Getting address...',
    });
    
    // Get address for the selected coordinate
    await getAddressForCoordinate(coordinate);
  };

  const getAddressForCoordinate = async (coordinate: {
    latitude: number;
    longitude: number;
  }) => {
    setIsLoadingAddress(true);
    try {
      const address = await GoogleMapsService.reverseGeocode(
        coordinate.latitude,
        coordinate.longitude
      );
      
      const destinationData = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: address,
      };
      
      setDestinationLocation(destinationData);
      onDestinationChange(destinationData);
    } catch (error) {
      console.error('Error getting address:', error);
      const fallbackAddress = `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`;
      
      const destinationData = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: fallbackAddress,
      };
      
      setDestinationLocation(destinationData);
      onDestinationChange(destinationData);
    } finally {
      setIsLoadingAddress(false);
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

  const fitMarkersToMap = () => {
    if (currentLocation && destinationLocation && mapRef.current) {
      const coordinates = [
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        {
          latitude: destinationLocation.latitude,
          longitude: destinationLocation.longitude,
        },
      ];
      
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 100,
          right: 50,
          bottom: 50,
          left: 50,
        },
        animated: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation={false}
        showsMyLocationButton={false}
        mapType="standard"
        pitchEnabled={true}
        rotateEnabled={true}
        showsBuildings={true}
        showsPointsOfInterest={true}
        customMapStyle={GOOGLE_MAPS_CONFIG.MAP_STYLE}
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
      >
        {/* Current Location Marker (Pickup Point) */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Pickup point"
            description={currentLocation.address}
            pinColor="#2196F3"
          >
            <View style={styles.pickupMarker}>
              <Ionicons name="location" size={20} color="white" />
            </View>
          </Marker>
        )}

        {/* Destination Marker */}
        {destinationLocation && (
          <Marker
            coordinate={{
              latitude: destinationLocation.latitude,
              longitude: destinationLocation.longitude,
            }}
            title="Destination"
            description={destinationLocation.address}
            pinColor="#FF5722"
          >
            <View style={styles.destinationMarker}>
              <Ionicons name="flag" size={20} color="white" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Pickup Point Info Card */}
      {currentLocation && (
        <Surface style={[styles.pickupCard, { backgroundColor: theme.colors.surface }]} elevation={4}>
          <View style={styles.cardContent}>
            <View style={styles.pickupIndicator}>
              <View style={styles.pickupDot} />
            </View>
            <View style={styles.cardText}>
              <Text variant="labelMedium" style={styles.cardTitle}>
                Pickup point
              </Text>
              <Text variant="bodySmall" style={[styles.cardAddress, { color: theme.colors.onSurface }]}>
                {currentLocation.address}
              </Text>
            </View>
            <View style={styles.cardAction}>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.onSurfaceVariant} />
            </View>
          </View>
        </Surface>
      )}

      {/* Loading Indicators */}
      {(isLoadingLocation || isLoadingAddress) && (
        <Surface style={[styles.loadingCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
              {isLoadingLocation ? 'Getting your location...' : 'Getting address...'}
            </Text>
          </View>
        </Surface>
      )}

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <FAB
          icon="crosshairs-gps"
          size="small"
          onPress={centerOnCurrentLocation}
          style={[styles.fab, { backgroundColor: theme.colors.surface }]}
        />
        {currentLocation && destinationLocation && (
          <FAB
            icon="fit-to-page-outline"
            size="small"
            onPress={fitMarkersToMap}
            style={[styles.fab, { backgroundColor: theme.colors.surface }]}
          />
        )}
      </View>

      {/* Instructions */}
      {!destinationLocation && !isLoadingLocation && (
        <Surface style={[styles.instructionCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={2}>
          <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, textAlign: 'center' }}>
            Tap on the map to select your destination
          </Text>
        </Surface>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: width,
    height: height * 0.6, // 60% of screen height
  },
  pickupCard: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickupIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  cardAddress: {
    fontSize: 12,
    opacity: 0.8,
  },
  cardAction: {
    padding: 4,
  },
  loadingCard: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    gap: 8,
  },
  fab: {
    borderRadius: 28,
  },
  pickupMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  destinationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default MapDestinationSelector;
