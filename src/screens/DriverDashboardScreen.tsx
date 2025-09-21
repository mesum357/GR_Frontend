import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { Card, Title, Button, Chip, Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';
import io from 'socket.io-client';

interface RideRequest {
  id: string;
  rider: {
    _id: string;
    firstName: string;
    lastName: string;
    rating: number;
    totalRides: number;
  };
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
  distance: number;
  estimatedDuration: number;
  requestedPrice: number;
  suggestedPrice: number;
  vehicleType: string;
  paymentMethod: string;
  notes: string;
  isUrgent: boolean;
  expiresAt: string;
  createdAt: string;
  timeRemaining: number;
  driverDistance?: number;
  estimatedTime?: number;
}

interface NegotiationModalProps {
  visible: boolean;
  rideRequest: RideRequest | null;
  onClose: () => void;
  onAccept: (rideRequestId: string) => void;
  onNegotiate: (rideRequestId: string, counterOffer: number) => void;
}

const DriverDashboardScreen = () => {
  const { theme } = useTheme();
  const { token, user } = useAuth();
  const socketRef = useRef<any>(null);
  
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [driverLocation, setDriverLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [negotiationModal, setNegotiationModal] = useState<{
    visible: boolean;
    rideRequest: RideRequest | null;
  }>({ visible: false, rideRequest: null });
  const [counterOffer, setCounterOffer] = useState('');

  // Get driver's current location
  const getDriverLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      setDriverLocation(coords);
      setLocationError(null);
      return coords;
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Failed to get location');
      return null;
    }
  };

  // Initialize location and polling for available ride requests
  useEffect(() => {
    if (token && user && user.userType === 'driver' && isOnline) {
      // Get initial location
      getDriverLocation();
    }
  }, [token, user, isOnline]);

  // Poll for available ride requests when online
  useEffect(() => {
    if (token && user && user.userType === 'driver' && isOnline) {
      // Poll for available ride requests every 3 seconds
      const pollInterval = setInterval(async () => {
        try {
          if (driverLocation) {
            // Use location-based endpoint if location is available
            const response = await fetch(`https://backend-gr-x2ki.onrender.com/api/ride-requests/available?latitude=${driverLocation.latitude}&longitude=${driverLocation.longitude}&radius=1.2`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              setRideRequests(data.requests || []);
            }
          } else {
            // Fallback to simple endpoint if no location
            const response = await fetch('https://backend-gr-x2ki.onrender.com/api/ride-requests/available-simple', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              setRideRequests(data.rideRequests || []);
            }
          }
        } catch (error) {
          console.error('Error polling for ride requests:', error);
        }
      }, 3000);

      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [token, user, isOnline, driverLocation]);

  useEffect(() => {
    if (isOnline) {
      fetchAvailableRequests();
    }
  }, [isOnline]);

  const fetchAvailableRequests = async () => {
    try {
      if (!driverLocation) {
        console.log('🔧 No driver location available, using simple endpoint');
        // Fallback to simple endpoint if no location
        const response = await fetch('https://backend-gr-x2ki.onrender.com/api/ride-requests/available-simple', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔧 Fetched all ride requests (no location):', data);
          setRideRequests(data.rideRequests || []);
        } else {
          const error = await response.json();
          console.error('Error fetching requests:', error);
          setRideRequests([]);
        }
        return;
      }

      const response = await fetch(`https://backend-gr-x2ki.onrender.com/api/ride-requests/available?latitude=${driverLocation.latitude}&longitude=${driverLocation.longitude}&radius=1.2`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔧 Fetched ride requests within 1.2km:', data);
        setRideRequests(data.requests || []);
      } else {
        const error = await response.json();
        console.error('Error fetching requests:', error);
        setRideRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRideRequests([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Refresh location first, then fetch requests
    await getDriverLocation();
    fetchAvailableRequests();
  };

  const handleAcceptRide = async (rideRequestId: string) => {
    try {
      const response = await fetch(`https://backend-gr-x2ki.onrender.com/api/ride-requests/${rideRequestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'accept',
          driverId: user?._id
        }),
      });

      if (response.ok) {
        setRideRequests(prev => prev.filter(req => req.id !== rideRequestId));
        Alert.alert('Success', 'Ride request accepted successfully!');
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to accept ride request');
      }
    } catch (error) {
      console.error('Error accepting ride request:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const handleNegotiateRide = (rideRequest: RideRequest) => {
    setNegotiationModal({ visible: true, rideRequest });
    setCounterOffer(rideRequest.requestedPrice.toString());
  };

  const handleCounterOffer = async () => {
    if (negotiationModal.rideRequest && counterOffer) {
      const offerAmount = parseFloat(counterOffer);
      if (offerAmount > 0) {
        try {
          const response = await fetch(`https://backend-gr-x2ki.onrender.com/api/ride-requests/${negotiationModal.rideRequest.id}/respond`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: 'negotiate',
              driverId: user?._id,
              counterOffer: offerAmount
            }),
          });

          if (response.ok) {
            setNegotiationModal({ visible: false, rideRequest: null });
            setRideRequests(prev => prev.filter(req => req.id !== negotiationModal.rideRequest!.id));
            Alert.alert('Success', 'Counter offer sent successfully!');
          } else {
            const error = await response.json();
            Alert.alert('Error', error.error || 'Failed to send counter offer');
          }
        } catch (error) {
          console.error('Error sending counter offer:', error);
          Alert.alert('Error', 'Network error. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Please enter a valid counter offer amount');
      }
    }
  };

  const closeNegotiationModal = () => {
    setNegotiationModal({ visible: false, rideRequest: null });
    setCounterOffer('');
  };

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
    if (!isOnline) {
      fetchAvailableRequests();
    } else {
      setRideRequests([]);
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

  const RequestCard = ({ request }: { request: RideRequest }) => (
    <Card style={[styles.requestCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.requestHeader}>
          <View style={styles.riderInfo}>
            <Avatar.Text
              size={40}
              label={`${request.rider.firstName[0]}${request.rider.lastName[0]}`}
              style={{ backgroundColor: theme.colors.primary }}
              labelStyle={{ color: theme.colors.onPrimary, fontSize: 14 }}
            />
            <View style={styles.riderDetails}>
              <Text style={[styles.riderName, { color: theme.colors.onSurface }]}>
                {request.rider.firstName} {request.rider.lastName}
              </Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={12} color={theme.colors.accent} />
                <Text style={[styles.rating, { color: theme.colors.onSurfaceVariant }]}>
                  {request.rider.rating} • {request.rider.totalRides} rides
                </Text>
              </View>
            </View>
          </View>
          
          {request.isUrgent && (
            <Chip
              mode="outlined"
              textStyle={{ fontSize: 10 }}
              style={[styles.urgentChip, { borderColor: theme.colors.error }]}
            >
              URGENT
            </Chip>
          )}
        </View>

        <View style={styles.tripInfo}>
          <View style={styles.locationItem}>
            <View style={[styles.locationDot, { backgroundColor: theme.colors.primary }]} />
            <Text style={[styles.locationText, { color: theme.colors.onSurface }]}>
              {request.pickupLocation.address}
            </Text>
          </View>
          
          <View style={styles.locationDivider} />
          
          <View style={styles.locationItem}>
            <View style={[styles.locationDot, { backgroundColor: theme.colors.secondary }]} />
            <Text style={[styles.locationText, { color: theme.colors.onSurface }]}>
              {request.destination.address}
            </Text>
          </View>
        </View>

        <View style={styles.tripStats}>
          <View style={styles.statItem}>
            <Ionicons name="location" size={14} color={theme.colors.secondary} />
            <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
              {formatDistance(request.distance)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={14} color={theme.colors.secondary} />
            <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
              {formatTime(request.estimatedDuration)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="cash" size={14} color={theme.colors.secondary} />
            <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
              PKR {request.requestedPrice}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={14} color={theme.colors.secondary} />
            <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
              {request.timeRemaining}min left
            </Text>
          </View>
        </View>

        {request.notes && (
          <View style={styles.notesContainer}>
            <Ionicons name="chatbubble" size={14} color={theme.colors.secondary} />
            <Text style={[styles.notesText, { color: theme.colors.onSurfaceVariant }]}>
              {request.notes}
            </Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => handleNegotiateRide(request)}
            style={[styles.actionButton, { borderColor: theme.colors.secondary }]}
            textColor={theme.colors.secondary}
            compact
          >
            Negotiate
          </Button>
          <Button
            mode="contained"
            onPress={() => handleAcceptRide(request.id)}
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            buttonColor={theme.colors.primary}
            compact
          >
            Accept
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Available Rides</Text>
          <Text style={styles.headerSubtitle}>
            {isOnline ? `${rideRequests.length} requests available` : 'You are offline'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.onlineToggle,
            { backgroundColor: isOnline ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' }
          ]}
          onPress={handleToggleOnline}
        >
          <Ionicons 
            name={isOnline ? "radio-button-on" : "radio-button-off"} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </View>

      {/* Online Status */}
      <Card style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.statusContent}>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusTitle, { color: theme.colors.onSurface }]}>
                {isOnline ? 'You are Online' : 'You are Offline'}
              </Text>
              <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>
                {isOnline 
                  ? 'You can see and accept ride requests' 
                  : 'Go online to see available rides'
                }
              </Text>
            </View>
            <Chip
              mode="outlined"
              textStyle={{ fontSize: 12 }}
              style={[
                styles.statusChip,
                { borderColor: isOnline ? theme.colors.primary : theme.colors.outline }
              ]}
            >
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Location Status */}
      <Card style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.statusContent}>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusTitle, { color: theme.colors.onSurface }]}>
                Location Status
              </Text>
              <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>
                {driverLocation 
                  ? `Lat: ${driverLocation.latitude.toFixed(4)}, Lng: ${driverLocation.longitude.toFixed(4)}`
                  : locationError || 'Getting location...'
                }
              </Text>
            </View>
            <Chip
              mode="outlined"
              textStyle={{ fontSize: 12 }}
              style={[
                styles.statusChip,
                { borderColor: driverLocation ? theme.colors.primary : theme.colors.outline }
              ]}
            >
              {driverLocation ? 'LOCATED' : 'LOCATING'}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Ride Requests */}
      <ScrollView
        style={styles.requestsList}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {isOnline ? (
          rideRequests.length > 0 ? (
            rideRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={64} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                No Requests Within 1.2km
              </Text>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                {driverLocation 
                  ? 'No ride requests found within 1.2km radius. Pull to refresh to check again.'
                  : 'Location not available. Please enable location services.'
                }
              </Text>
            </View>
          )
        ) : (
          <View style={styles.offlineState}>
            <Ionicons name="radio-button-off" size={64} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.offlineTitle, { color: theme.colors.onSurface }]}>
              You are Offline
            </Text>
            <Text style={[styles.offlineText, { color: theme.colors.onSurfaceVariant }]}>
              Go online to see available ride requests
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Negotiation Modal */}
      <Modal
        visible={negotiationModal.visible}
        transparent
        animationType="slide"
        onRequestClose={closeNegotiationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Make Counter Offer
            </Text>
            
            {negotiationModal.rideRequest && (
              <View style={styles.modalInfo}>
                <Text style={[styles.modalText, { color: theme.colors.onSurfaceVariant }]}>
                  Rider: {negotiationModal.rideRequest.rider.firstName} {negotiationModal.rideRequest.rider.lastName}
                </Text>
                <Text style={[styles.modalText, { color: theme.colors.onSurfaceVariant }]}>
                  Original Offer: PKR {negotiationModal.rideRequest.offeredFare}
                </Text>
                <Text style={[styles.modalText, { color: theme.colors.onSurfaceVariant }]}>
                  Distance: {formatDistance(negotiationModal.rideRequest.distance)}
                </Text>
              </View>
            )}

            <TextInput
              style={[styles.counterOfferInput, { 
                borderColor: theme.colors.outline,
                color: theme.colors.onSurface 
              }]}
              placeholder="Enter your counter offer"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={counterOffer}
              onChangeText={setCounterOffer}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={closeNegotiationModal}
                style={[styles.modalButton, { borderColor: theme.colors.outline }]}
                textColor={theme.colors.onSurface}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleCounterOffer}
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                buttonColor={theme.colors.primary}
              >
                Send Offer
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
  onlineToggle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCard: {
    margin: 20,
    borderRadius: 16,
    elevation: 4,
  },
  statusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
  },
  statusChip: {
    height: 24,
  },
  requestsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  requestCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    marginLeft: 4,
  },
  urgentChip: {
    height: 20,
  },
  tripInfo: {
    gap: 8,
    marginBottom: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    flex: 1,
  },
  locationDivider: {
    width: 2,
    height: 16,
    backgroundColor: '#e0e0e0',
    marginLeft: 3,
  },
  tripStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  notesText: {
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  offlineState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalInfo: {
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 4,
  },
  counterOfferInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

export default DriverDashboardScreen;
