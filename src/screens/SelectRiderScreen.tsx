import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { Card, Title, Paragraph, Button, Avatar, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface Rider {
  id: string;
  name: string;
  rating: number;
  totalRides: number;
  vehicle: {
    model: string;
    plateNumber: string;
    color: string;
  };
  distance: number; // in km
  estimatedTime: number; // in minutes
  price: number; // in PKR
  isOnline: boolean;
  profileImage?: string;
}

interface RouteParams {
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
}

const SelectRiderScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  const params = route.params as RouteParams;

  // Mock riders data
  const mockRiders: Rider[] = [
    {
      id: '1',
      name: 'Ahmed Khan',
      rating: 4.8,
      totalRides: 1250,
      vehicle: {
        model: 'Toyota Corolla',
        plateNumber: 'GB-1234',
        color: 'White',
      },
      distance: 0.8,
      estimatedTime: 3,
      price: 150,
      isOnline: true,
    },
    {
      id: '2',
      name: 'Sara Ahmed',
      rating: 4.9,
      totalRides: 890,
      vehicle: {
        model: 'Honda City',
        plateNumber: 'GB-5678',
        color: 'Silver',
      },
      distance: 1.2,
      estimatedTime: 5,
      price: 160,
      isOnline: true,
    },
    {
      id: '3',
      name: 'Muhammad Ali',
      rating: 4.7,
      totalRides: 2100,
      vehicle: {
        model: 'Suzuki Swift',
        plateNumber: 'GB-9012',
        color: 'Blue',
      },
      distance: 1.5,
      estimatedTime: 7,
      price: 140,
      isOnline: true,
    },
    {
      id: '4',
      name: 'Fatima Zahra',
      rating: 4.6,
      totalRides: 650,
      vehicle: {
        model: 'Toyota Vitz',
        plateNumber: 'GB-3456',
        color: 'Red',
      },
      distance: 2.1,
      estimatedTime: 10,
      price: 130,
      isOnline: true,
    },
  ];

  useEffect(() => {
    // Simulate API call to get nearby riders
    setTimeout(() => {
      setRiders(mockRiders);
      setIsLoading(false);
    }, 2000);
  }, []);

  const handleSelectRider = (rider: Rider) => {
    setSelectedRider(rider);
  };

  const handleConfirmRide = async () => {
    if (!selectedRider) {
      Alert.alert('Error', 'Please select a rider first');
      return;
    }

    setIsBooking(true);
    
    try {
      // Simulate booking API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Ride Confirmed!',
        `Your ride with ${selectedRider.name} has been confirmed. They will arrive in ${selectedRider.estimatedTime} minutes.`,
        [
          {
            text: 'OK',
                         onPress: () => {
               // Navigate back to rider home
               navigation.navigate('RiderHome' as never);
             },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm ride. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 1) return 'Less than 1 min';
    return `${minutes} min`;
  };

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  const RiderCard = ({ rider, isSelected }: { rider: Rider; isSelected: boolean }) => (
    <TouchableOpacity
      onPress={() => handleSelectRider(rider)}
      style={[
        styles.riderCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isSelected ? theme.colors.primary : theme.colors.outline,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
    >
      <View style={styles.riderHeader}>
        <View style={styles.riderInfo}>
          <Avatar.Text
            size={50}
            label={rider.name.split(' ').map(n => n[0]).join('')}
            style={{ backgroundColor: theme.colors.primary }}
            labelStyle={{ color: theme.colors.onPrimary, fontSize: 18 }}
          />
          <View style={styles.riderDetails}>
            <Text style={[styles.riderName, { color: theme.colors.onSurface }]}>
              {rider.name}
            </Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={theme.colors.accent} />
              <Text style={[styles.rating, { color: theme.colors.onSurfaceVariant }]}>
                {rider.rating} • {rider.totalRides} rides
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.riderStatus}>
          <Chip
            mode="outlined"
            textStyle={{ fontSize: 12 }}
            style={[
              styles.onlineChip,
              { borderColor: theme.colors.primary }
            ]}
          >
            Online
          </Chip>
        </View>
      </View>

      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleDetails}>
          <Ionicons name="car" size={16} color={theme.colors.primary} />
          <Text style={[styles.vehicleText, { color: theme.colors.onSurface }]}>
            {rider.vehicle.model} • {rider.vehicle.color}
          </Text>
        </View>
        <Text style={[styles.plateNumber, { color: theme.colors.onSurfaceVariant }]}>
          {rider.vehicle.plateNumber}
        </Text>
      </View>

      <View style={styles.rideInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="time" size={16} color={theme.colors.secondary} />
          <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
            {formatTime(rider.estimatedTime)}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="location" size={16} color={theme.colors.secondary} />
          <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
            {formatDistance(rider.distance)}
          </Text>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: theme.colors.primary }]}>
            PKR {rider.price}
          </Text>
        </View>
      </View>

      {isSelected && (
        <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="checkmark" size={20} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContent}>
          <Ionicons name="car-sport" size={64} color={theme.colors.primary} />
          <Text style={[styles.loadingTitle, { color: theme.colors.onSurface }]}>
            Finding Nearby Riders
          </Text>
          <Text style={[styles.loadingSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Please wait while we locate the best drivers for you
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Select Rider</Text>
          <Text style={styles.headerSubtitle}>
            {riders.length} riders available nearby
          </Text>
        </View>
      </View>

      {/* Trip Details */}
      <Card style={[styles.tripCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Trip Details</Title>
          
          <View style={styles.tripInfo}>
            <View style={styles.locationItem}>
              <View style={[styles.locationDot, { backgroundColor: theme.colors.primary }]} />
              <Text style={[styles.locationText, { color: theme.colors.onSurface }]}>
                {params.pickupLocation.address}
              </Text>
            </View>
            
            <View style={styles.locationDivider} />
            
            <View style={styles.locationItem}>
              <View style={[styles.locationDot, { backgroundColor: theme.colors.secondary }]} />
              <Text style={[styles.locationText, { color: theme.colors.onSurface }]}>
                {params.destination.address}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Riders List */}
      <ScrollView
        style={styles.ridersList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 120 + insets.bottom : 120,
        }}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Available Riders
        </Text>
        
        {riders.map((rider) => (
          <RiderCard
            key={rider.id}
            rider={rider}
            isSelected={selectedRider?.id === rider.id}
          />
        ))}
      </ScrollView>

      {/* Confirm Button */}
      {selectedRider && (
        <View style={[styles.confirmContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.confirmInfo}>
            <Text style={[styles.confirmText, { color: theme.colors.onSurface }]}>
              Selected: {selectedRider.name}
            </Text>
            <Text style={[styles.confirmPrice, { color: theme.colors.primary }]}>
              PKR {selectedRider.price}
            </Text>
          </View>
          
          <Button
            mode="contained"
            onPress={handleConfirmRide}
            style={[styles.confirmButton, { backgroundColor: theme.colors.primary }]}
            loading={isBooking}
            disabled={isBooking}
            buttonColor={theme.colors.primary}
            contentStyle={styles.confirmButtonContent}
            labelStyle={[styles.confirmButtonLabel, { color: '#FFFFFF' }]}
          >
            {isBooking ? 'Confirming...' : 'Confirm Ride'}
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 40,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  tripCard: {
    margin: 20,
    borderRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tripInfo: {
    gap: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  locationText: {
    fontSize: 16,
    flex: 1,
  },
  locationDivider: {
    width: 2,
    height: 20,
    backgroundColor: '#e0e0e0',
    marginLeft: 5,
  },
  ridersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  riderCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  riderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  riderDetails: {
    marginLeft: 12,
    flex: 1,
  },
  riderName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    marginLeft: 4,
  },
  riderStatus: {
    alignItems: 'flex-end',
  },
  onlineChip: {
    height: 24,
  },
  vehicleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
  },
  vehicleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleText: {
    fontSize: 14,
    marginLeft: 6,
  },
  plateNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  rideInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  confirmInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '500',
  },
  confirmPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  confirmButton: {
    borderRadius: 12,
    elevation: 2,
  },
  confirmButtonContent: {
    paddingVertical: 8,
  },
  confirmButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SelectRiderScreen;
