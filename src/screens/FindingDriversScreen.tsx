import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Text, Surface, Switch, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { LocationService } from '../services/LocationService';

const { width, height } = Dimensions.get('window');

interface FindingDriversScreenProps {
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
  offeredFare: number;
  paymentMethod: string;
  autoAccept: boolean;
  onCancel: () => void;
  onDriverOffer: (driverOffer: DriverOffer) => void;
}

interface DriverOffer {
  id: string;
  driverName: string;
  driverRating: number;
  vehicleType: string;
  estimatedTime: string;
  offeredFare: number;
  distance: number;
}

const FindingDriversScreen: React.FC<FindingDriversScreenProps> = ({
  pickupLocation,
  destination,
  offeredFare,
  paymentMethod,
  autoAccept,
  onCancel,
  onDriverOffer,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  
  const [currentFare, setCurrentFare] = useState(offeredFare);
  const [isAutoAccept, setIsAutoAccept] = useState(autoAccept);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState(paymentMethod);
  const [searchRadius, setSearchRadius] = useState(1.2); // km
  const [drivers, setDrivers] = useState<DriverOffer[]>([]);
  const [isSearching, setIsSearching] = useState(true);
  const [searchTime, setSearchTime] = useState(0);

  useEffect(() => {
    startDriverSearch();
    const timer = setInterval(() => {
      setSearchTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const startDriverSearch = async () => {
    setIsSearching(true);
    setSearchTime(0);
    
    // Simulate finding drivers in 1.2km radius
    setTimeout(() => {
      const mockDrivers = generateMockDrivers();
      setDrivers(mockDrivers);
      setIsSearching(false);
    }, 3000);
  };

  const generateMockDrivers = (): DriverOffer[] => {
    const driverNames = ['Ahmed Ali', 'Muhammad Hassan', 'Ali Khan', 'Sara Ahmed', 'Hassan Ali'];
    const vehicleTypes = ['Car', 'Bike', 'Car', 'Bike', 'Car'];
    
    return driverNames.map((name, index) => {
      const baseOffer = currentFare + Math.floor(Math.random() * 50) - 25;
      return {
        id: `driver_${index + 1}`,
        driverName: name,
        driverRating: 4.2 + Math.random() * 0.8,
        vehicleType: vehicleTypes[index],
        estimatedTime: `${Math.floor(Math.random() * 10) + 3} min`,
        offeredFare: Math.max(50, baseOffer), // Ensure minimum fare
        distance: Math.random() * 1.2,
      };
    });
  };

  const handleFareAdjustment = (amount: number) => {
    const newFare = Math.max(50, currentFare + amount);
    setCurrentFare(newFare);
  };

  const handleRaiseFare = () => {
    Alert.alert(
      'Raise Fare',
      'Enter additional amount to raise your fare',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '+10', onPress: () => handleFareAdjustment(10) },
        { text: '+20', onPress: () => handleFareAdjustment(20) },
        { text: '+50', onPress: () => handleFareAdjustment(50) },
      ]
    );
  };

  const handlePaymentMethodChange = () => {
    Alert.alert(
      'Payment Method',
      'Select payment method',
      [
        { text: 'Cash', onPress: () => setCurrentPaymentMethod('cash') },
        { text: 'Card', onPress: () => setCurrentPaymentMethod('card') },
        { text: 'Digital Wallet', onPress: () => setCurrentPaymentMethod('wallet') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleDriverOffer = (driver: DriverOffer) => {
    onDriverOffer(driver);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Map Section */}
      <View style={styles.mapContainer}>
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
              latitude: (pickupLocation.latitude + destination.latitude) / 2,
              longitude: (pickupLocation.longitude + destination.longitude) / 2,
            },
            pitch: 0,
            heading: 0,
            altitude: 2000,
            zoom: 15,
          }}
        >
          {/* Pickup Location Marker */}
          <Marker
            coordinate={pickupLocation}
            title="Pickup Location"
            description={pickupLocation.address}
          >
            <View style={styles.pickupMarker}>
              <Ionicons name="location" size={20} color="white" />
            </View>
          </Marker>

          {/* Destination Marker */}
          <Marker
            coordinate={destination}
            title="Destination"
            description={destination.address}
          >
            <View style={styles.destinationMarker}>
              <Ionicons name="flag" size={20} color="white" />
            </View>
          </Marker>

          {/* Search Radius Circle */}
          <Circle
            center={pickupLocation}
            radius={searchRadius * 1000} // Convert km to meters
            strokeColor="#4CAF50"
            fillColor="rgba(76, 175, 80, 0.1)"
            strokeWidth={2}
          />

          {/* Driver Markers */}
          {drivers.map((driver, index) => (
            <Marker
              key={driver.id}
              coordinate={{
                latitude: pickupLocation.latitude + (Math.random() - 0.5) * 0.01,
                longitude: pickupLocation.longitude + (Math.random() - 0.5) * 0.01,
              }}
              title={driver.driverName}
              description={`${driver.vehicleType} • ${driver.estimatedTime}`}
            >
              <View style={[styles.driverMarker, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="car" size={16} color="white" />
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Bottom Sheet */}
      <View style={[styles.bottomSheet, { backgroundColor: '#1C1C1E' }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isSearching ? 'Finding drivers...' : `Found ${drivers.length} drivers`}
          </Text>
          {isSearching && (
            <Text style={styles.searchTime}>
              {formatTime(searchTime)}
            </Text>
          )}
        </View>

        {/* Your Offer Section */}
        <View style={styles.offerSection}>
          <Text style={styles.sectionLabel}>Your offer</Text>
          <Text style={styles.offerAmount}>PKR {currentFare}</Text>
          
          <View style={styles.fareAdjustment}>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => handleFareAdjustment(-5)}
            >
              <Text style={styles.adjustButtonText}>-5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.adjustButton, styles.adjustButtonPlus]}
              onPress={() => handleFareAdjustment(5)}
            >
              <Text style={styles.adjustButtonText}>+5</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.raiseFareButton}
            onPress={handleRaiseFare}
          >
            <Text style={styles.raiseFareText}>Raise fare</Text>
          </TouchableOpacity>
        </View>

        {/* Auto Accept Toggle */}
        <View style={styles.autoAcceptSection}>
          <View style={styles.autoAcceptLeft}>
            <Ionicons name="paper-plane-outline" size={20} color="white" />
            <Text style={styles.autoAcceptText}>
              Automatically accept the nearest driver for PKR {currentFare}
            </Text>
          </View>
          <Switch
            value={isAutoAccept}
            onValueChange={setIsAutoAccept}
            color="#4CAF50"
          />
        </View>

        {/* Payment Section */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionLabel}>Payment</Text>
          <TouchableOpacity
            style={styles.paymentMethod}
            onPress={handlePaymentMethodChange}
          >
            <Ionicons name="cash-outline" size={20} color="#4CAF50" />
            <Text style={styles.paymentText}>PKR {currentFare} {currentPaymentMethod}</Text>
          </TouchableOpacity>
        </View>

        {/* Current Ride Details */}
        <View style={styles.rideDetailsSection}>
          <Text style={styles.sectionLabel}>Your current ride</Text>
          
          <View style={styles.rideLocation}>
            <View style={[styles.locationDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.locationText}>{pickupLocation.address}</Text>
          </View>
          
          <View style={styles.rideLocation}>
            <View style={[styles.locationDot, { backgroundColor: '#FF5722' }]} />
            <Text style={styles.locationText}>{destination.address}</Text>
          </View>
        </View>

        {/* Driver Offers */}
        {!isSearching && drivers.length > 0 && (
          <View style={styles.driversSection}>
            <Text style={styles.sectionLabel}>Available drivers</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {drivers.map((driver) => (
                <TouchableOpacity
                  key={driver.id}
                  style={styles.driverCard}
                  onPress={() => handleDriverOffer(driver)}
                >
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{driver.driverName}</Text>
                    <Text style={styles.driverDetails}>
                      {driver.vehicleType} • {driver.estimatedTime} • {driver.distance.toFixed(1)}km
                    </Text>
                    <Text style={styles.driverRating}>
                      ⭐ {driver.driverRating.toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.driverOffer}>
                    <Text style={styles.driverOfferAmount}>PKR {driver.offeredFare}</Text>
                    <Text style={styles.driverOfferLabel}>Driver's offer</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: width,
    height: '100%',
  },
  pickupMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  destinationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  driverMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.7,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  searchTime: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  offerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 10,
  },
  offerAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  fareAdjustment: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  adjustButton: {
    width: 60,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  adjustButtonPlus: {
    backgroundColor: '#4CAF50',
  },
  adjustButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  raiseFareButton: {
    backgroundColor: '#333',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  raiseFareText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  autoAcceptSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 10,
  },
  autoAcceptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  autoAcceptText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  paymentSection: {
    marginBottom: 20,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  paymentText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
  rideDetailsSection: {
    marginBottom: 20,
  },
  rideLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  locationText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  driversSection: {
    marginBottom: 20,
  },
  driverCard: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    width: 200,
  },
  driverInfo: {
    marginBottom: 10,
  },
  driverName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  driverDetails: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 5,
  },
  driverRating: {
    color: '#FFD700',
    fontSize: 12,
  },
  driverOffer: {
    alignItems: 'center',
  },
  driverOfferAmount: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  driverOfferLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
  },
  cancelButton: {
    backgroundColor: '#333',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FF5722',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FindingDriversScreen;
