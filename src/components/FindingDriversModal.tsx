import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
  Modal,
  Animated,
  PanResponder,
} from 'react-native';
import { Text, Surface, Switch, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { LocationService } from '../services/LocationService';
import DriverOfferModal from './DriverOfferModal';
import { GoogleMapsService } from '../services/GoogleMapsService';
import { getApiConfig, authenticatedApiRequestData } from '../config/api';
import io from 'socket.io-client';

const { width, height } = Dimensions.get('window');

interface FindingDriversModalProps {
  visible: boolean;
  onClose: () => void;
  onCancelRide: () => void;
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
  rideRequestId?: string | null;
  onRideRequestIdChange?: (newRideRequestId: string) => void;
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
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

const FindingDriversModal: React.FC<FindingDriversModalProps> = ({
  visible,
  onClose,
  onCancelRide,
  pickupLocation,
  destination,
  offeredFare,
  paymentMethod,
  autoAccept,
  rideRequestId,
  onRideRequestIdChange,
  onDriverOffer,
}) => {
  const { theme } = useTheme();
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const socketRef = useRef<any>(null);
  
  const [currentFare, setCurrentFare] = useState(offeredFare);
  const [isAutoAccept, setIsAutoAccept] = useState(autoAccept);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState(paymentMethod);
  const [searchRadius, setSearchRadius] = useState(1.2); // km - changed to 1.2km as per requirements
  const [drivers, setDrivers] = useState<DriverOffer[]>([]);
  const [isSearching, setIsSearching] = useState(true);
  const [searchTime, setSearchTime] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{latitude: number; longitude: number}>>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [counterOffers, setCounterOffers] = useState<Array<{driverId: string; counterOffer: number}>>([]);
  const [isUpdatingFare, setIsUpdatingFare] = useState(false);
  const [showDriverOfferModal, setShowDriverOfferModal] = useState(false);
  const [driverOffer, setDriverOffer] = useState<{
    driverName: string;
    driverRating: number;
    fareAmount: number;
    arrivalTime: number;
    vehicleInfo: string;
  } | null>(null);
  
  // Drag functionality
  const translateY = useRef(new Animated.Value(0)).current;
  const bottomSheetHeight = height * 0.6;
  const maxTranslateY = bottomSheetHeight - 100; // Minimum height when dragged up

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 2; // Reduced threshold for smoother response
      },
      onPanResponderGrant: () => {
        translateY.setOffset((translateY as any)._value);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward movement with smooth following
        if (gestureState.dy > 0) {
          // Add some resistance for smoother feel
          const resistance = 0.8;
          translateY.setValue(gestureState.dy * resistance);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        
        // If dragged down more than 80px, close the modal
        if (gestureState.dy > 80) {
          Animated.timing(translateY, {
            toValue: bottomSheetHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          // Snap back to original position with smoother animation
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 150,
            friction: 10,
            velocity: gestureState.vy,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    console.log('🔧 FindingDriversModal: useEffect triggered, visible:', visible);
    if (visible) {
      console.log('🔧 FindingDriversModal: Modal is visible, loading route and starting search');
      // Reset animation when modal opens
      translateY.setValue(0);
      loadRoute();
      startDriverSearch();
      startSearching();
      const timer = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
      
      return () => {
        clearInterval(timer);
        stopSearching();
      };
    } else {
      // Modal is closing, stop searching
      stopSearching();
    }
  }, [visible]);

  // Debug mount/unmount
  useEffect(() => {
    console.log('🔧 FindingDriversModal: Component mounted');
    return () => {
      console.log('🔧 FindingDriversModal: Component unmounted');
    };
  }, []);

  const loadRoute = async () => {
    try {
      // Add null checks to prevent latitude error
      if (!pickupLocation || !destination) {
        console.log('⚠️ Cannot load route: pickupLocation or destination is null');
        return;
      }
      
      setIsLoadingRoute(true);
      const directions = await GoogleMapsService.getDirections(
        { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
        { latitude: destination.latitude, longitude: destination.longitude }
      );
      
      if (directions && directions.polyline) {
        const points = GoogleMapsService.decodePolyline(directions.polyline);
        setRouteCoordinates(points);
        
        // Calculate route bounds for focused map view
        if (mapRef.current && points.length > 0) {
          // Calculate bounds from route points
          const lats = points.map(point => point.latitude);
          const lngs = points.map(point => point.longitude);
          
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          
          // Calculate the actual span of the route
          let latSpan = maxLat - minLat;
          let lngSpan = maxLng - minLng;
          
          // If route is very short (same location), use a small fixed area
          if (latSpan < 0.0001) latSpan = 0.001; // ~100m
          if (lngSpan < 0.0001) lngSpan = 0.001; // ~100m
          
          // Add padding to accommodate 2km search radius
          // Convert 2km to degrees (approximate: 1 degree ≈ 111km)
          const radiusInDegrees = 2.0 / 111; // ~0.018 degrees
          
          // Add padding for 2km radius plus some extra space
          const latPadding = Math.max(latSpan * 0.3, radiusInDegrees * 1.5);
          const lngPadding = Math.max(lngSpan * 0.3, radiusInDegrees * 1.5);
          
          // Ensure minimum deltas to show 2km radius
          const minLatDelta = radiusInDegrees * 2.5; // ~4.5km total view
          const minLngDelta = radiusInDegrees * 2.5; // ~4.5km total view
          
          const region = {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: Math.max(latSpan + latPadding, minLatDelta),
            longitudeDelta: Math.max(lngSpan + lngPadding, minLngDelta),
          };
          
          // Set the region directly for more precise control
          mapRef.current.animateToRegion(region, 1000);
        }
      }
    } catch (error) {
      console.error('Error loading route:', error);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Initialize polling for ride request status
  useEffect(() => {
    if (visible && token && user && rideRequestId) {
      // Poll for ride request status every 2 seconds
      const pollInterval = setInterval(async () => {
        try {
          const apiConfig = getApiConfig();
          const response = await fetch(`${apiConfig.baseURL}/api/ride-requests/${rideRequestId}/status`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.status === 'accepted') {
              clearInterval(pollInterval);
              Alert.alert(
                'Driver Found!',
                'A driver has been assigned to your ride request.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      onDriverOffer({
                        id: data.driverId,
                        driverName: 'Driver',
                        driverRating: 4.5,
                        vehicleType: 'Car',
                        estimatedTime: '3 min',
                        offeredFare: currentFare,
                        distance: 0.8,
                        coordinates: pickupLocation
                      });
                    }
                  }
                ]
              );
            } else if (data.status === 'cancelled') {
              clearInterval(pollInterval);
              Alert.alert('Ride Cancelled', 'Your ride request has been cancelled.');
            }
          }
        } catch (error) {
          console.error('Error polling ride request status:', error);
        }
      }, 2000);

      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [visible, token, user, rideRequestId]);

  const startDriverSearch = async () => {
    setIsSearching(true);
    setSearchTime(0);
    
    try {
      if (!user || user.userType !== 'rider') {
        Alert.alert('Login required', 'Please login as a rider to request a ride.');
        setIsSearching(false);
        return;
      }
      console.log('🔧 Payment method being sent:', currentPaymentMethod);
      // Call the endpoint via authenticated helper (ensures fresh token/headers)
      const data = await authenticatedApiRequestData('/api/ride-requests/request-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: {
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
            address: pickupLocation.address
          },
          destination: {
            latitude: destination.latitude,
            longitude: destination.longitude,
            address: destination.address
          },
          offeredFare: currentFare,
          radiusMeters: searchRadius * 1000,
          paymentMethod: currentPaymentMethod,
          vehicleType: 'any',
          notes: ''
        })
      });

      console.log('Response data:', data);

      if (data && data.rideRequest) {
        console.log('Ride request sent to drivers:', data);
        
        // Set the ride request ID for cancellation
        if (data.rideRequest?.id && onRideRequestIdChange) {
          onRideRequestIdChange(data.rideRequest.id);
        }
        
        // Start search timer
        const timer = setInterval(() => {
          setSearchTime(prev => prev + 1);
        }, 1000);

        // Stop searching after 30 seconds if no driver found
        setTimeout(() => {
          if (isSearching) {
            setIsSearching(false);
            clearInterval(timer);
            Alert.alert(
              'No Drivers Found',
              'No drivers were available in your area. Please try again or adjust your fare.',
              [{ text: 'OK' }]
            );
          }
        }, 30000);

      } else {
        console.error('API Error:', data);
        Alert.alert('Error', data?.error || 'Failed to send ride request');
        setIsSearching(false);
      }
    } catch (error) {
      console.error('Error sending ride request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error details:', errorMessage);
      Alert.alert('Error', `Network error: ${errorMessage}. Please try again.`);
      setIsSearching(false);
    }
  };

  const generateDriverCoordinates = (centerLat: number, centerLng: number, radiusKm: number) => {
    // Generate random coordinates within the radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusKm; // Distance in km
    
    // Convert km to degrees (approximate)
    const latOffset = (distance / 111) * Math.cos(angle);
    const lngOffset = (distance / (111 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
    
    return {
      latitude: centerLat + latOffset,
      longitude: centerLng + lngOffset,
    };
  };

  const generateMockDrivers = (): DriverOffer[] => {
    const driverNames = ['Ahmed Ali', 'Muhammad Hassan', 'Ali Khan', 'Sara Ahmed', 'Hassan Ali'];
    const vehicleTypes = ['Car', 'Bike', 'Car', 'Bike', 'Car'];
    
    return driverNames.map((name, index) => {
      const baseOffer = currentFare + Math.floor(Math.random() * 50) - 25;
      const distance = Math.random() * 2.0; // Within 2km radius
      const coordinates = generateDriverCoordinates(pickupLocation.latitude, pickupLocation.longitude, 2.0);
      
      return {
        id: `driver_${index + 1}`,
        driverName: name,
        driverRating: 4.2 + Math.random() * 0.8,
        vehicleType: vehicleTypes[index],
        estimatedTime: `${Math.floor(Math.random() * 10) + 3} min`,
        offeredFare: Math.max(50, baseOffer), // Ensure minimum fare
        distance: distance,
        coordinates: coordinates,
      };
    });
  };

  const handleFareAdjustment = async (amount: number) => {
    const newFare = Math.max(50, currentFare + amount);
    setCurrentFare(newFare);
    setIsUpdatingFare(true);
    
    // Cancel the previous request if it exists
    if (rideRequestId && token) {
      try {
        console.log(`🚫 Cancelling previous ride request: ${rideRequestId}`);
        const apiConfig = getApiConfig();
        const cancelResponse = await fetch(`${apiConfig.baseURL}/api/ride-requests/${rideRequestId}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (cancelResponse.ok) {
          console.log(`✅ Previous ride request ${rideRequestId} cancelled successfully`);
        } else {
          console.warn(`⚠️ Failed to cancel previous ride request: ${rideRequestId}`);
        }
      } catch (cancelError) {
        console.error('❌ Error cancelling previous ride request:', cancelError);
      }
    }
    
    // Create a new ride request with the raised fare
    try {
      console.log(`💰 Creating new ride request with raised fare: PKR ${newFare}`);
      
      const apiConfig = getApiConfig();
      const response = await fetch(`${apiConfig.baseURL}/api/ride-requests/request-ride`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          pickup: {
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
            address: pickupLocation.address
          },
          destination: {
            latitude: destination.latitude,
            longitude: destination.longitude,
            address: destination.address
          },
          offeredFare: newFare,
          radiusMeters: 1200,
          paymentMethod: currentPaymentMethod,
          vehicleType: 'any',
          notes: ''
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ New ride request created successfully with PKR ${newFare}`, result);
        
        // Update the rideRequestId to the new request
        if (result.rideRequest?.id) {
          // Update the parent component with the new ride request ID
          if (onRideRequestIdChange) {
            onRideRequestIdChange(result.rideRequest.id);
          }
        }
      } else {
        const error = await response.json();
        console.error('❌ Failed to create new ride request:', error);
        Alert.alert('Error', 'Failed to update fare. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error creating new ride request:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsUpdatingFare(false);
    }
  };

  const handleRaiseFare = () => {
    // Raise fare by 20 PKR in real-time
    handleFareAdjustment(20);
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

  const handleDriverOfferReceived = (offer: {
    driverName: string;
    driverRating: number;
    fareAmount: number;
    arrivalTime: number;
    vehicleInfo: string;
  }) => {
    setDriverOffer(offer);
    setShowDriverOfferModal(true);
  };

  const handleAcceptDriverOffer = () => {
    // Handle accepting the driver offer
    console.log('Accepting driver offer:', driverOffer);
    setShowDriverOfferModal(false);
    // Add your accept logic here
  };

  const handleRejectDriverOffer = () => {
    // Handle rejecting the driver offer
    console.log('Rejecting driver offer:', driverOffer);
    setShowDriverOfferModal(false);
    // Add your reject logic here
  };

  const startSearching = async () => {
    if (!rideRequestId || !token) return;
    
    try {
      console.log('🔍 Starting search for drivers...');
      const apiConfig = getApiConfig();
      const response = await fetch(`${apiConfig.baseURL}/api/ride-requests/${rideRequestId}/start-searching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('✅ Started searching for drivers');
      } else {
        console.error('❌ Failed to start searching');
      }
    } catch (error) {
      console.error('❌ Error starting search:', error);
    }
  };

  const stopSearching = async () => {
    if (!rideRequestId || !token) return;
    
    try {
      console.log('⏸️ Stopping search for drivers...');
      const apiConfig = getApiConfig();
      const response = await fetch(`${apiConfig.baseURL}/api/ride-requests/${rideRequestId}/stop-searching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('✅ Stopped searching for drivers');
      } else {
        console.error('❌ Failed to stop searching');
      }
    } catch (error) {
      console.error('❌ Error stopping search:', error);
    }
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride Request',
      'Are you sure you want to cancel this ride request?',
      [
        {
          text: 'Keep Searching',
          style: 'cancel',
        },
        {
          text: 'Cancel Ride',
          style: 'destructive',
          onPress: () => {
            console.log('🔧 Cancelling ride from modal, rideRequestId:', rideRequestId);
            onCancelRide();
            onClose();
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      transparent={false}
      statusBarTranslucent={false}
      hardwareAccelerated={true}
      onShow={() => {
        console.log('🔧 FindingDriversModal: onShow fired - modal is now visible');
      }}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Finding drivers
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Map Section */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: (pickupLocation.latitude + destination.latitude) / 2,
              longitude: (pickupLocation.longitude + destination.longitude) / 2,
              latitudeDelta: Math.max(Math.abs(pickupLocation.latitude - destination.latitude) * 1.5, 0.018 * 2.5),
              longitudeDelta: Math.max(Math.abs(pickupLocation.longitude - destination.longitude) * 1.5, 0.018 * 2.5),
            }}
            showsUserLocation={false}
            showsMyLocationButton={false}
            mapType="standard"
            showsBuildings={true}
            showsPointsOfInterest={true}
            showsTraffic={false}
            showsIndoors={false}
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

            {/* Route Polyline */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#2196F3"
                strokeWidth={4}
                lineDashPattern={[0]}
              />
            )}

            {/* Search Radius Circle */}
            <Circle
              center={pickupLocation}
              radius={searchRadius * 1000} // Convert km to meters (2km = 2000m)
              strokeColor="#4CAF50"
              fillColor="rgba(76, 175, 80, 0.1)"
              strokeWidth={2}
            />

            {/* Driver Markers */}
            {drivers.map((driver) => (
              <Marker
                key={driver.id}
                coordinate={driver.coordinates}
                title={driver.driverName}
                description={`${driver.vehicleType} • ${driver.estimatedTime} • ${driver.distance.toFixed(1)}km`}
              >
                <View style={[styles.driverMarker, { backgroundColor: '#4CAF50' }]}>
                  <Ionicons name="car" size={16} color="white" />
                </View>
              </Marker>
            ))}
          </MapView>
          
          {/* Route Loading Indicator */}
          {isLoadingRoute && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading route...</Text>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Sheet */}
        <Animated.View 
          style={[
            styles.bottomSheet, 
            { 
              backgroundColor: '#1C1C1E',
              transform: [{ translateY: translateY }]
            }
          ]}
          {...panResponder.panHandlers}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
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
            <View style={styles.fareDisplayContainer}>
              <Text style={styles.offerAmount}>PKR {currentFare}</Text>
              {isUpdatingFare && (
                <View style={styles.updatingIndicator}>
                  <Ionicons name="refresh" size={16} color="#4CAF50" />
                </View>
              )}
            </View>
            
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
              onPress={handleCancelRide}
            >
              <Ionicons name="close-circle" size={20} color="white" style={styles.cancelIcon} />
              <Text style={styles.cancelButtonText}>Cancel ride</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>

      {/* Driver Offer Modal */}
      {driverOffer && (
        <DriverOfferModal
          visible={showDriverOfferModal}
          onClose={() => setShowDriverOfferModal(false)}
          onAccept={handleAcceptDriverOffer}
          onReject={handleRejectDriverOffer}
          driverName={driverOffer.driverName}
          driverRating={driverOffer.driverRating}
          fareAmount={driverOffer.fareAmount}
          arrivalTime={driverOffer.arrivalTime}
          vehicleInfo={driverOffer.vehicleInfo}
        />
      )}
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
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 34,
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
    height: height * 0.6,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  handle: {
    width: 50,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  searchTime: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  offerSection: {
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 10,
  },
  offerAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  fareAdjustment: {
    flexDirection: 'row',
    marginBottom: 10,
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
    marginBottom: 15,
    paddingVertical: 8,
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
    marginBottom: 15,
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
    marginBottom: 15,
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
    marginBottom: 15,
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
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelIcon: {
    marginRight: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  fareDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updatingIndicator: {
    marginLeft: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
});

export default FindingDriversModal;
