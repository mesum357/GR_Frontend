import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform, TouchableOpacity, Alert } from 'react-native';
import { Text, Surface, FAB } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GoogleMapsService, DirectionsResult } from '../services/GoogleMapsService';
import OfferFareModal from './OfferFareModal';

// Only import MapView on mobile platforms
let MapView: any = null;
let PROVIDER_GOOGLE: any = null;
let PROVIDER_DEFAULT: any = null;
let Marker: any = null;
let Polyline: any = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  PROVIDER_DEFAULT = Maps.PROVIDER_DEFAULT;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
}

const { width, height } = Dimensions.get('window');

interface RouteMapViewProps {
  pickupLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  onFindDriver: (fare?: number, paymentMethod?: string, autoAccept?: boolean) => void;
  onBack: () => void;
  vehicleType?: 'bike' | 'car' | 'truck';
  selectedTransportMode?: {
    id: string;
    name: string;
    icon: string;
    capacity: number;
    basePrice: number;
  } | null;
}

const RouteMapView: React.FC<RouteMapViewProps> = ({
  pickupLocation,
  destination,
  onFindDriver,
  onBack,
  vehicleType = 'car',
  selectedTransportMode,
}) => {
  const { theme } = useTheme();
  const mapRef = useRef<MapView>(null);
  
  const [region, setRegion] = useState({
    latitude: pickupLocation?.latitude && destination?.latitude 
      ? (pickupLocation.latitude + destination.latitude) / 2 
      : 35.9208,
    longitude: pickupLocation?.longitude && destination?.longitude 
      ? (pickupLocation.longitude + destination.longitude) / 2 
      : 74.3144,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFareModal, setShowFareModal] = useState(false);
  const [offeredFare, setOfferedFare] = useState<number | null>(null);
  const [distance, setDistance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [autoAccept, setAutoAccept] = useState(false);

  useEffect(() => {
    loadDirections();
  }, []);

  const loadDirections = async () => {
    try {
      // Add null checks to prevent latitude error
      if (!pickupLocation || !destination) {
        console.log('⚠️ Cannot load directions: pickupLocation or destination is null');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const result = await GoogleMapsService.getDirections(
        { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
        { latitude: destination.latitude, longitude: destination.longitude }
      );
      setDirections(result);
      
      // Calculate distance in kilometers
      const distanceKm = result.distance.value / 1000;
      setDistance(distanceKm);
      
      // Fit map to show both locations
      if (mapRef.current) {
        const coordinates = [
          { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
          { latitude: destination.latitude, longitude: destination.longitude },
        ];
        
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 200, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.error('Error loading directions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFareConfirm = (fare: number, paymentMethod: string, autoAccept: boolean) => {
    setOfferedFare(fare);
    setPaymentMethod(paymentMethod);
    setAutoAccept(autoAccept);
    setShowFareModal(false);
    // Call onFindDriver after setting the fare
    onFindDriver(fare, paymentMethod, autoAccept);
  };

  const handleFindDriver = () => {
    if (offeredFare) {
      onFindDriver(offeredFare, paymentMethod, autoAccept);
    } else {
      setShowFareModal(true);
    }
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
        <View style={styles.bottomSection}>
          <TouchableOpacity style={[styles.findDriverButton, { backgroundColor: theme.colors.primary }]} onPress={handleFindDriver}>
            <Text style={[styles.findDriverText, { color: theme.colors.onPrimary }]}>Find a driver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation={false}
        showsMyLocationButton={false}
        mapType="standard"
        pitchEnabled={true}
        rotateEnabled={true}
        showsBuildings={true}
        showsPointsOfInterest={true}
        camera={{
          center: {
            latitude: pickupLocation?.latitude && destination?.latitude 
              ? (pickupLocation.latitude + destination.latitude) / 2 
              : 35.9208,
            longitude: pickupLocation?.longitude && destination?.longitude 
              ? (pickupLocation.longitude + destination.longitude) / 2 
              : 74.3144,
          },
          pitch: 0,
          heading: 0,
          altitude: 2000,
          zoom: 15,
        }}
      >
        {/* Pickup Location Marker */}
        {pickupLocation && (
          <Marker
            coordinate={pickupLocation}
            title="Pickup Location"
            description={pickupLocation.address}
          >
            <View style={styles.pickupMarker}>
              <View style={styles.pickupMarkerInner}>
                <Ionicons name="location" size={16} color="white" />
              </View>
            </View>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker
            coordinate={destination}
            title="Destination"
            description={destination.address}
          >
            <View style={styles.destinationMarker}>
              <View style={styles.destinationMarkerInner}>
                <Ionicons name="flag" size={16} color="white" />
              </View>
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {directions && (
          <Polyline
            coordinates={GoogleMapsService.decodePolyline(directions.polyline)}
            strokeColor="#4CAF50"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {/* Vehicle Type Display */}
      {selectedTransportMode && (
        <Surface style={[styles.vehicleTypeCard, { backgroundColor: theme.colors.surface }]} elevation={3}>
          <View style={styles.vehicleTypeContent}>
            <View style={[styles.vehicleTypeIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name={selectedTransportMode.icon} size={20} color="white" />
            </View>
            <View style={styles.vehicleTypeText}>
              <Text style={[styles.vehicleTypeName, { color: theme.colors.onSurface }]}>
                {selectedTransportMode.name}
              </Text>
              <Text style={[styles.vehicleTypeCapacity, { color: theme.colors.onSurfaceVariant }]}>
                {selectedTransportMode.capacity} passengers
              </Text>
            </View>
          </View>
        </Surface>
      )}

      {/* Bottom Section */}
      <View style={[styles.bottomSection, { backgroundColor: theme.colors.surface }]}>
        {/* Location Info */}
        <View style={styles.locationInfo}>
          <View style={styles.locationItem}>
            <View style={[styles.locationDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={[styles.locationText, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {pickupLocation.address}
            </Text>
          </View>
          <View style={styles.locationItem}>
            <View style={[styles.locationDot, { backgroundColor: '#F44336' }]} />
            <Text style={[styles.locationText, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {destination.address}
            </Text>
          </View>
        </View>

        {/* Fare Input Section */}
        <View style={styles.fareSection}>
          <TouchableOpacity 
            style={[styles.fareInput, { backgroundColor: theme.colors.surfaceVariant }]}
            onPress={() => setShowFareModal(true)}
          >
            <Text style={[styles.fareInputText, { color: theme.colors.onSurface }]}>
              {offeredFare ? `PKR ${offeredFare}` : 'PKR Offer your fare'}
            </Text>
            <Ionicons name="pencil" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Find Driver Button */}
        <TouchableOpacity 
          style={[styles.findDriverButton, { backgroundColor: theme.colors.primary }]} 
          onPress={handleFindDriver}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.findDriverText, { color: theme.colors.onPrimary }]}>
            Find a driver
          </Text>
          <Ionicons name="settings" size={20} color={theme.colors.onPrimary} style={styles.settingsIcon} />
        </TouchableOpacity>
      </View>

      {/* Offer Fare Modal */}
      <OfferFareModal
        visible={showFareModal}
        onClose={() => setShowFareModal(false)}
        onConfirmFare={handleFareConfirm}
        vehicleType={vehicleType}
        distance={distance}
        baseFare={offeredFare || undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height * 0.7,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  vehicleTypeCard: {
    position: 'absolute',
    top: 50,
    right: 16,
    left: 70, // Leave space for back button
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  vehicleTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleTypeText: {
    flex: 1,
  },
  vehicleTypeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  vehicleTypeCapacity: {
    fontSize: 12,
    opacity: 0.7,
  },
  vehicleTypePrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  locationInfo: {
    marginBottom: 20,
    gap: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  fareSection: {
    marginBottom: 16,
  },
  fareInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  fareInputText: {
    fontSize: 16,
    fontWeight: '500',
  },
  findDriverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  findDriverText: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingsIcon: {
    marginLeft: 8,
  },
  pickupMarker: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupMarkerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
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
  destinationMarker: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationMarkerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default RouteMapView;


