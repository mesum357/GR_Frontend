import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Card, Title, Button, Avatar, ActivityIndicator, Chip, Switch } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { authenticatedApiRequest } from '../../config/api';
import { LocationService } from '../../services/LocationService';
import RideRouteModal from '../../components/RideRouteModal';
import NotificationService from '../../services/NotificationService';
import { webSocketService } from '../../services/WebSocketService';

interface RideRequest {
  _id: string;
  id: string;
  pickupLocation: string; // String for backward compatibility with card rendering
  pickupLocationDetails: {
    address: string;
    coordinates: [number, number];
  };
  destinationDetails: {
    address: string;
    coordinates: [number, number];
  };
  dropoffLocation: string;
  distance: string;
  estimatedFare: number;
  requestedPrice: number;
  estimatedDuration: number;
  estimatedDistance: number;
  riderName: string;
  riderPhone: string;
  riderRating: number;
  estimatedTime: string;
  requestTime: string;
  paymentMethod: 'cash' | 'card' | 'wallet';
  specialRequests?: string;
  riderOffer?: number;
  vehicleType?: string;
  autoAccept?: boolean;
  status: string;
  createdAt: string;
}

const DriverRideRequestsScreen: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const { token, user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingRequest, setAcceptingRequest] = useState<string | null>(null);
  const [offeringRequest, setOfferingRequest] = useState<string | null>(null);
  const [driverOffers, setDriverOffers] = useState<{[key: string]: number}>({});
  const [selectedRideRequest, setSelectedRideRequest] = useState<RideRequest | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fareUpdates, setFareUpdates] = useState<{[key: string]: boolean}>({});
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [notificationPermission, setNotificationPermission] = useState<boolean>(false);
  const [notifiedRequests, setNotifiedRequests] = useState<Set<string>>(new Set());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundTaskRef = useRef<number | null>(null);

  useEffect(() => {
    console.log('🔧 DriverRideRequestsScreen useEffect:', { 
      user: !!user, 
      token: !!token, 
      isOnline, 
      userType: user?.userType 
    });
    fetchRideRequests(true); // Show loading on initial load
    setupNotifications();
  }, [isOnline]);

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    if (user && isOnline) {
      console.log('🔌 Setting up WebSocket listeners for driver:', user._id);
      // Authenticate with WebSocket
      webSocketService.authenticate(user._id, 'driver');

      // Auto-add new ride requests pushed by backend
      const handleNewRideRequest = (data: any) => {
        try {
          const id = data.rideRequestId || data._id || data.id;
          if (!id) return;
          setRideRequests(prev => {
            const exists = prev.some(r => r.id === id);
            if (exists) return prev;
            const mapped: RideRequest = {
              _id: id,
              id,
              pickupLocation: data.pickup?.address || data.pickupLocation?.address || 'Unknown location',
              pickupLocationDetails: {
                address: data.pickup?.address || data.pickupLocation?.address || 'Unknown location',
                coordinates: [
                  (data.pickup?.longitude ?? data.pickupLocation?.longitude ?? 0),
                  (data.pickup?.latitude ?? data.pickupLocation?.latitude ?? 0),
                ],
              },
              destinationDetails: {
                address: data.destination?.address || data.dropoff?.address || 'Unknown destination',
                coordinates: [
                  (data.destination?.longitude ?? data.dropoff?.longitude ?? 0),
                  (data.destination?.latitude ?? data.dropoff?.latitude ?? 0),
                ],
              },
              dropoffLocation: data.destination?.address || data.dropoff?.address || 'Unknown destination',
              distance: typeof data.distance === 'number' ? `${data.distance.toFixed(1)} km` : (data.distance || '0 km'),
              estimatedFare: data.offeredFare ?? data.requestedPrice ?? 0,
              requestedPrice: data.requestedPrice ?? 0,
              estimatedDuration: data.estimatedDuration ?? 0,
              estimatedDistance: typeof data.distance === 'number' ? data.distance : parseFloat((data.distance || '0').toString().replace(' km','')) || 0,
              riderName: data.rider ? `${data.rider.firstName || ''} ${data.rider.lastName || ''}`.trim() || 'Unknown Rider' : 'Unknown Rider',
              riderPhone: data.rider?.phone || 'N/A',
              riderRating: data.rider?.rating || 4.5,
              estimatedTime: data.estimatedDuration ? `${data.estimatedDuration} min` : 'Unknown',
              requestTime: data.createdAt ? new Date(data.createdAt).toLocaleTimeString() : 'Unknown',
              paymentMethod: data.paymentMethod || 'cash',
              specialRequests: data.notes,
              riderOffer: data.requestedPrice,
              vehicleType: data.vehicleType,
              autoAccept: false,
              status: data.status || 'pending',
              createdAt: data.createdAt || new Date().toISOString(),
            };
            return [mapped, ...prev];
          });
        } catch (e) {
          console.error('Error handling new ride_request event:', e);
        }
      };

      // Listen for ride request cancellations
      const handleRideRequestCancelled = (data: any) => {
        console.log('🔧 Received ride request cancellation:', data);
        
        // Remove the cancelled request from the local state
        setRideRequests(prev => {
          const filtered = prev.filter(req => req.id !== data.rideRequestId);
          console.log(`🔧 Removed cancelled request ${data.rideRequestId}. Remaining requests: ${filtered.length}`);
          return filtered;
        });
        
        // No popup alert - cancelled rides disappear silently
      };

      // Listen for fare response timeout
      const handleFareResponseTimeout = (data: any) => {
        console.log('⏰ Fare response timeout:', data);
        // Close any open modals and return to ride requests
        setIsModalVisible(false);
        setSelectedRideRequest(null);
        Alert.alert('Timeout', 'Rider did not respond within 15 seconds. Returning to ride requests.');
      };

      // Listen for fare response from rider
      const handleFareResponse = (data: any) => {
        console.log('💰 Received fare response:', data);
        if (data.action === 'accept') {
          // Close modal and show success
          setIsModalVisible(false);
          setSelectedRideRequest(null);
          Alert.alert('Success!', 'Rider accepted your offer. Proceeding to pickup location.');
        } else if (data.action === 'decline') {
          // Close modal and return to ride requests
          setIsModalVisible(false);
          setSelectedRideRequest(null);
          Alert.alert('Offer Declined', 'Rider declined your offer. Returning to ride requests.');
        }
      };

      // Set up WebSocket listeners
      webSocketService.on('ride_request', handleNewRideRequest);
      webSocketService.on('ride_request_cancelled', handleRideRequestCancelled);
      webSocketService.on('ride_cancelled', handleRideRequestCancelled);
      webSocketService.on('fare_response_timeout', handleFareResponseTimeout);
      webSocketService.on('fare_response', handleFareResponse);

      return () => {
        webSocketService.off('ride_request', handleNewRideRequest);
        webSocketService.off('ride_request_cancelled', handleRideRequestCancelled);
        webSocketService.off('ride_cancelled', handleRideRequestCancelled);
        webSocketService.off('fare_response_timeout', handleFareResponseTimeout);
        webSocketService.off('fare_response', handleFareResponse);
      };
    }
  }, [user, isOnline]);

  // App state change handler
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      setAppState(nextAppState);
      if (nextAppState === 'background') {
        // Start background task when app goes to background
        if (isOnline) {
          startBackgroundTask();
        }
      } else if (nextAppState === 'active') {
        // Stop background task when app becomes active
        stopBackgroundTask();
        // Refresh data when app becomes active
        if (isOnline) {
          fetchRideRequests();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isOnline]);

  // Background task management
  const startBackgroundTask = () => {
    if (backgroundTaskRef.current) {
      clearInterval(backgroundTaskRef.current);
    }
    
    backgroundTaskRef.current = setInterval(() => {
      if (isOnline) {
        fetchRideRequests();
      }
    }, 10000); // Check every 10 seconds in background
  };

  const stopBackgroundTask = () => {
    if (backgroundTaskRef.current) {
      clearInterval(backgroundTaskRef.current);
      backgroundTaskRef.current = null;
    }
  };

  // Polling for ride requests - REDUCED FREQUENCY
  useEffect(() => {
    if (isOnline && token) {
      // Clear any existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      // Start polling with reduced frequency to prevent excessive requests
      pollingIntervalRef.current = setInterval(() => {
        fetchRideRequests();
      }, 5000); // Reduced frequency to 5 seconds to prevent excessive requests

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    } else {
      // Clear interval when offline
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [isOnline, token, appState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (backgroundTaskRef.current) {
        clearInterval(backgroundTaskRef.current);
      }
    };
  }, []);

  const setupNotifications = async () => {
    try {
      // FIXED: Use correct method name
      const permissionResult = await NotificationService.requestPermissions();
      const hasPermission = permissionResult.status === 'granted';
      setNotificationPermission(hasPermission);
      
      if (hasPermission) {
        console.log('🔔 Notification permission granted');
      } else {
        console.log('🔔 Notification permission denied');
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      setNotificationPermission(false);
    }
  };

  const processNotifications = () => {
    if (!notificationPermission) return;

    rideRequests.forEach(request => {
      if (!notifiedRequests.has(request.id)) {
        // Show notification for new request
        NotificationService.sendLocalNotification(
          'New Ride Request',
          `${request.riderName} needs a ride from ${request.pickupLocation}`,
          {
            data: { rideRequestId: request.id }
          }
        );
        
        // Mark as notified
        setNotifiedRequests(prev => new Set([...prev, request.id]));
      }
    });
  };

  const fetchRideRequests = async (showLoading = false) => {
    console.log('🔧 fetchRideRequests called:', { token: !!token, isOnline, showLoading });
    
    if (!token || !isOnline) {
      console.log('🔧 fetchRideRequests early return:', { token: !!token, isOnline });
      return;
    }

    try {
      if (showLoading) {
        setIsLoading(true);
      }

      console.log('🔧 Making API request to /api/ride-requests/available-simple');
      const simpleData = await authenticatedApiRequest('/api/ride-requests/available-simple', {
        method: 'GET',
      });

      const simpleList: RideRequest[] = (simpleData?.rideRequests || []) as RideRequest[];
      const dedupSimple = simpleList.filter((request, index, self) => index === self.findIndex(r => r.id === request.id));
      console.log('🔧 Simple list received:', dedupSimple.length);
      setRideRequests(dedupSimple);
      processNotifications();
      if (dedupSimple.length !== rideRequests.length) {
        console.log(`🔧 Ride requests updated: ${dedupSimple.length} available`);
      }
    } catch (error) {
      console.error('Error fetching ride requests (simple):', error);
      // Fallback: use location-aware endpoint
      try {
        console.log('🔧 Fallback to /api/ride-requests/available with driver location');
        const coords = await LocationService.getCurrentLocationCoordinates();
        const url = `/api/ride-requests/available?latitude=${coords.latitude}&longitude=${coords.longitude}&radius=5`;
        const nearbyData = await authenticatedApiRequest(url, { method: 'GET' });
        const list = (nearbyData?.rideRequests || nearbyData?.requests || []) as RideRequest[];
        const dedup = list.filter((request, index, self) => index === self.findIndex(r => r.id === request.id));
        console.log('🔧 Nearby list received:', dedup.length);
        setRideRequests(dedup);
        processNotifications();
      } catch (fbError) {
        console.error('Error fetching ride requests (fallback):', fbError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRideRequests();
    setRefreshing(false);
  };

  const handleAcceptRide = async (requestId: string) => {
    if (!token) return;

    setAcceptingRequest(requestId);
    try {
      const response = await authenticatedApiRequest(`/ride-requests/${requestId}/accept`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Ride accepted successfully:', data);
        
        // Remove the accepted request from the list
        setRideRequests(prev => prev.filter(req => req.id !== requestId));
        
        // Show success message
        Alert.alert('Success!', 'Ride request accepted successfully.');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to accept ride request');
      }
    } catch (error) {
      console.error('Error accepting ride:', error);
      Alert.alert('Error', 'Failed to accept ride request');
    } finally {
      setAcceptingRequest(null);
    }
  };

  const handleDeclineRide = (requestId: string) => {
    Alert.alert(
      'Decline Ride Request?',
      'Are you sure you want to decline this ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            setRideRequests(prev => prev.filter(req => req.id !== requestId));
          }
        }
      ]
    );
  };

  const handleOfferRide = (requestId: string) => {
    const request = rideRequests.find(req => req.id === requestId);
    if (!request) return;

    Alert.prompt(
      'Make Your Offer',
      `Rider offered PKR ${request.riderOffer}. Enter your counter offer:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Offer',
          onPress: async (offerText) => {
            const offer = parseFloat(offerText || '0');
            if (isNaN(offer) || offer <= 0) {
              Alert.alert('Invalid Offer', 'Please enter a valid amount');
              return;
            }

            setOfferingRequest(requestId);
            try {
              const response = await authenticatedApiRequest(`/ride-requests/${requestId}/offer`, {
                method: 'POST',
                body: JSON.stringify({ offer }),
              });

              if (response.ok) {
                const data = await response.json();
                console.log('Counter offer sent successfully:', data);
                
                // Update the request with the counter offer
                setRideRequests(prev => 
                  prev.map(req => 
                    req.id === requestId 
                      ? { ...req, driverOffer: offer, status: 'counter_offered' }
                      : req
                  )
                );
                
                Alert.alert('Success!', 'Counter offer sent successfully.');
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.message || 'Failed to send counter offer');
              }
            } catch (error) {
              console.error('Error sending counter offer:', error);
              Alert.alert('Error', 'Failed to send counter offer');
            } finally {
              setOfferingRequest(null);
            }
          },
        }
      ],
      'plain-text',
      request.riderOffer?.toString() || ''
    );
  };

  const handleCardPress = (request: RideRequest) => {
    // Close any existing modal first
    if (isModalVisible) {
      setIsModalVisible(false);
      setSelectedRideRequest(null);
    }
    
    setSelectedRideRequest(request);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedRideRequest(null);
  };

  const handleSkipModal = () => {
    setIsModalVisible(false);
    setSelectedRideRequest(null);
  };

  const handleModalAccept = async (rideRequestId: string, fareAmount: number) => {
    try {
      const response = await authenticatedApiRequest(`/ride-requests/${rideRequestId}/accept`, {
        method: 'POST',
        body: JSON.stringify({ fareAmount }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Ride accepted via modal:', data);
        
        // Remove the accepted request from the list
        setRideRequests(prev => prev.filter(req => req.id !== rideRequestId));
        
        // Close modal
        setIsModalVisible(false);
        setSelectedRideRequest(null);
        
        Alert.alert('Success!', 'Ride request accepted successfully.');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to accept ride request');
      }
    } catch (error) {
      console.error('Error accepting ride via modal:', error);
      Alert.alert('Error', 'Failed to accept ride request');
    }
  };

  const handleModalOfferFare = async (rideRequestId: string, fareAmount: number) => {
    try {
      const response = await authenticatedApiRequest(`/ride-requests/${rideRequestId}/offer`, {
        method: 'POST',
        body: JSON.stringify({ offer: fareAmount }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fare offer sent via modal:', data);
        
        // Update the request with the fare offer
        setRideRequests(prev => 
          prev.map(req => 
            req.id === rideRequestId 
              ? { ...req, driverOffer: fareAmount, status: 'fare_offered' }
              : req
          )
        );
        
        // Close modal
        setIsModalVisible(false);
        setSelectedRideRequest(null);
        
        Alert.alert('Success!', 'Fare offer sent successfully.');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to send fare offer');
      }
    } catch (error) {
      console.error('Error sending fare offer via modal:', error);
      Alert.alert('Error', 'Failed to send fare offer');
    }
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    if (!isOnline) {
      fetchRideRequests(true);
    } else {
      setRideRequests([]);
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.primary;
      case 'accepted': return theme.colors.tertiary;
      case 'counter_offered': return theme.colors.secondary;
      case 'fare_offered': return theme.colors.secondary;
      default: return theme.colors.outline;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Available';
      case 'accepted': return 'Accepted';
      case 'counter_offered': return 'Counter Offered';
      case 'fare_offered': return 'Fare Offered';
      default: return status;
    }
  };

  const renderRideRequestCard = (request: RideRequest) => (
    <Card 
      key={request.id} 
      style={[styles.card, { backgroundColor: theme.colors.surface }]} 
      elevation={2}
      onPress={() => handleCardPress(request)}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.riderInfo}>
            <Avatar.Text 
              size={40} 
              label={request.riderName.charAt(0).toUpperCase()} 
              style={{ backgroundColor: theme.colors.primary }}
            />
            <View style={styles.riderDetails}>
              <Text style={[styles.riderName, { color: theme.colors.onSurface }]}>
                {request.riderName}
              </Text>
              <View style={styles.riderRating}>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= request.riderRating ? 'star' : 'star-outline'}
                      size={12}
                      color={theme.colors.tertiary}
                    />
                  ))}
                </View>
                <Text style={[styles.ratingText, { color: theme.colors.onSurface }]}>
                  {request.riderRating.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.fareInfo}>
            <Text style={[styles.fareAmount, { color: theme.colors.primary }]}>
              PKR {request.estimatedFare}
            </Text>
            <Text style={[styles.fareLabel, { color: theme.colors.onSurface }]}>
              {request.riderOffer ? `Rider offered: PKR ${request.riderOffer}` : 'Estimated fare'}
            </Text>
            {request.driverOffer && (
              <Text style={[styles.driverOffer, { color: theme.colors.secondary }]}>
                Your offer: PKR {request.driverOffer}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.tripDetails}>
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: theme.colors.primary }]} />
            <Text style={[styles.locationText, { color: theme.colors.onSurface }]}>
              {request.pickupLocation}
            </Text>
          </View>
          
          <View style={styles.routeLine} />
          
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: theme.colors.tertiary }]} />
            <Text style={[styles.locationText, { color: theme.colors.onSurface }]}>
              {request.dropoffLocation}
            </Text>
          </View>
        </View>

        <View style={styles.tripInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="time" size={16} color={theme.colors.onSurface} />
            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
              {request.estimatedTime}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="car" size={16} color={theme.colors.onSurface} />
            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
              {formatDistance(request.estimatedDistance)}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="card" size={16} color={theme.colors.onSurface} />
            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
              {request.paymentMethod}
            </Text>
          </View>
          
          <Chip 
            style={[styles.timeChip, { backgroundColor: getStatusColor(request.status) }]}
            textStyle={[styles.timeChipText, { color: 'white' }]}
          >
            {getStatusText(request.status)}
          </Chip>
        </View>

        {request.specialRequests && (
          <View style={[styles.specialRequests, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="information-circle" size={16} color={theme.colors.primary} />
            <Text style={[styles.specialRequestsText, { color: theme.colors.onSurface }]}>
              {request.specialRequests}
            </Text>
          </View>
        )}

        {/* Action buttons removed per requirements */}

        {request.autoAccept && (
          <Chip 
            style={[styles.autoAcceptChip, { backgroundColor: theme.colors.tertiary }]}
            textStyle={[styles.autoAcceptChipText, { color: 'white' }]}
          >
            Auto Accept
          </Chip>
        )}
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          Loading ride requests...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              Available Rides
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.onSurface }]}>
              {rideRequests.length} ride{rideRequests.length !== 1 ? 's' : ''} available
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <Text style={[styles.onlineStatus, { color: isOnline ? theme.colors.tertiary : theme.colors.error }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={toggleOnlineStatus}
              color={theme.colors.primary}
            />
          </View>
        </View>
      </View>

      {/* Ride Requests */}
      {rideRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={64} color={theme.colors.outline} />
          <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
            {isOnline ? 'No rides available' : 'You are offline'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.onSurface }]}>
            {isOnline 
              ? 'Check back later for new ride requests' 
              : 'Go online to see available rides'
            }
          </Text>
        </View>
      ) : (
        <View style={styles.ridesList}>
          {rideRequests.map(renderRideRequestCard)}
        </View>
      )}

      {/* Tips for Getting More Requests */}
      {isOnline && (
        <Card style={[styles.tipsCard, { backgroundColor: theme.colors.tertiary + '20' }]} elevation={2}>
          <Card.Content>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={24} color={theme.colors.tertiary} />
              <Title style={[styles.cardTitle, { color: theme.colors.onSurface, marginLeft: 8 }]}>
                Tips for More Requests
              </Title>
            </View>

            <View style={styles.tipItem}>
              <Ionicons name="location" size={16} color={theme.colors.tertiary} />
              <Text style={[styles.tipText, { color: theme.colors.onSurface }]}>
                Stay near busy areas like airports, malls, and hotels
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Ionicons name="time" size={16} color={theme.colors.tertiary} />
              <Text style={[styles.tipText, { color: theme.colors.onSurface }]}>
                Drive during peak hours for higher demand
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Ionicons name="star" size={16} color={theme.colors.tertiary} />
              <Text style={[styles.tipText, { color: theme.colors.onSurface }]}>
                Maintain a high rating to get priority
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Ride Route Modal */}
      <RideRouteModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        onSkip={handleSkipModal}
        rideRequest={selectedRideRequest}
        onAccept={handleModalAccept}
        onOfferFare={handleModalOfferFare}
      />
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 20,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  onlineStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  ridesList: {
    padding: 20,
    gap: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  cardHeader: {
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
    fontWeight: '600',
    marginBottom: 4,
  },
  riderRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
  },
  fareInfo: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  fareLabel: {
    fontSize: 12,
  },
  tripDetails: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  locationText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 3,
    marginBottom: 8,
  },
  tripInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    marginLeft: 4,
  },
  timeChip: {
    marginLeft: 'auto',
  },
  timeChipText: {
    fontSize: 12,
  },
  specialRequests: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  specialRequestsText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    borderRadius: 8,
  },
  offerButton: {
    flex: 1,
    borderRadius: 8,
  },
  acceptButton: {
    flex: 1,
    borderRadius: 8,
  },
  driverOffer: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  autoAcceptChip: {
    marginLeft: 'auto',
  },
  autoAcceptChipText: {
    fontSize: 10,
  },
  tipsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    margin: 0,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});

export default DriverRideRequestsScreen;
