import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { Surface, FAB } from 'react-native-paper';
import { Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getApiConfig } from '../config/api';
import InteractiveRideMap from '../components/InteractiveRideMap';
import TransportModeSelector, { TransportMode } from '../components/TransportModeSelector';
import RouteEntryModal from '../components/RouteEntryModal';
import DestinationMapModal from '../components/DestinationMapModal';
import FindingDriversModal from '../components/FindingDriversModal';
import RiderOfferModal from '../components/RiderOfferModal';
import OfferFareModal from '../components/OfferFareModal';
import RiderRouteModal from '../components/RiderRouteModal';
import { LocationService, LocationData } from '../services/LocationService';
import { GoogleMapsService } from '../services/GoogleMapsService';
import { useShowModalWithIOSFix } from '../hooks/useShowModalWithIOSFix';
import { webSocketService, FareOfferMessage } from '../services/WebSocketService';

const { width, height } = Dimensions.get('window');

const RiderScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Location states
  const [pickupLocation, setPickupLocation] = useState('Shahr-e-Quaid-e-Azam');
  const [destination, setDestination] = useState('');
  const [pickupLocationData, setPickupLocationData] = useState<LocationData | null>(null);
  const [destinationData, setDestinationData] = useState<LocationData | null>(null);
  
  // Transport mode state
  const [selectedTransportMode, setSelectedTransportMode] = useState<TransportMode | null>(null);
  
  // UI states
  const [isSearching, setIsSearching] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [isDestinationMapVisible, setIsDestinationMapVisible] = useState(false);
  const [showFareOfferingModal, setShowFareOfferingModal] = useState(false);
  const [showRideRouteModal, setShowRideRouteModal] = useState(false);
  const [isMapInteracting, setIsMapInteracting] = useState(false);

  // Animation values for fullscreen-on-drag map behavior
  const mapHeightAnim = useRef(new Animated.Value(height * 0.5)).current;
  const sectionsTranslateY = useRef(new Animated.Value(0)).current;
  const sectionsOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isMapInteracting) {
      Animated.parallel([
        Animated.timing(mapHeightAnim, {
          toValue: height,
          duration: 220,
          easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          useNativeDriver: false,
        }),
        Animated.timing(sectionsTranslateY, {
          toValue: 100,
          duration: 200,
          easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(sectionsOpacity, {
          toValue: 0,
          duration: 160,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(mapHeightAnim, {
          toValue: height * 0.5,
          duration: 220,
          easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          useNativeDriver: false,
        }),
        Animated.timing(sectionsTranslateY, {
          toValue: 0,
          duration: 200,
          easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(sectionsOpacity, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isMapInteracting, mapHeightAnim, sectionsTranslateY, sectionsOpacity]);
  const [recentLocations, setRecentLocations] = useState<string[]>([
    'Khudadad Heights',
    'Service Rd I-11 S', 
    'I-12',
    '10 Street 1',
    'Kachnar Park',
    'Rajput Market',
    'Lane Number 6A'
  ]);
  
  // Finding drivers states
  const [offeredFare, setOfferedFare] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [autoAccept, setAutoAccept] = useState(false);
  const [currentRideRequestId, setCurrentRideRequestId] = useState<string | null>(null);
  
  // Driver offer states
  const [showRiderOfferModal, setShowRiderOfferModal] = useState(false);
  const [driverOffer, setDriverOffer] = useState<FareOfferMessage | null>(null);
  const modalTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // iOS modal fix hook
  const { mounted: modalMounted, visible: modalVisible, key: modalKey, open: openModal, close: closeModal } = useShowModalWithIOSFix();

  // Get user's current location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // WebSocket event handlers
  const handleFareOffer = useCallback((data: FareOfferMessage) => {
    console.log('💰 Received fare offer from driver:', data);
    
    // Clear any existing timeout
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current);
    }
    
    // Debounce modal state changes
    modalTimeoutRef.current = setTimeout(() => {
      setDriverOffer(data);
      setShowRiderOfferModal(true);
    }, 100);
  }, []);

  const handleFareOfferTimeout = useCallback((data: any) => {
    console.log('⏰ Fare offer timeout:', data);
    setShowRiderOfferModal(false);
    setDriverOffer(null);
    Alert.alert('Offer Expired', 'The driver offer has expired. Please request a new ride.');
  }, []);

  const handleFareResponseConfirmed = useCallback((data: any) => {
    console.log('💰 Fare response confirmed:', data);
    // Close the finding drivers modal if it's open
    closeModal();
  }, [closeModal]);

  const handleDriverAssigned = useCallback((data: any) => {
    console.log('🚗 Driver assigned:', data);
    // Close the finding drivers modal
    closeModal();
    // Show success message
    Alert.alert('Driver Found!', 'A driver has been assigned to your ride.');
  }, [closeModal]);

  // WebSocket event listeners for real-time driver offers
  useEffect(() => {
    if (user) {
      // Authenticate with WebSocket
      webSocketService.authenticate(user._id, 'rider');

      webSocketService.on('fare_offer', handleFareOffer);
      webSocketService.on('fare_offer_timeout', handleFareOfferTimeout);
      webSocketService.on('fare_response_confirmed', handleFareResponseConfirmed);
      webSocketService.on('driver_assigned', handleDriverAssigned);

      return () => {
        webSocketService.off('fare_offer', handleFareOffer);
        webSocketService.off('fare_offer_timeout', handleFareOfferTimeout);
        webSocketService.off('fare_response_confirmed', handleFareResponseConfirmed);
        webSocketService.off('driver_assigned', handleDriverAssigned);
      };
    }
  }, [user, closeModal]);

  const getCurrentLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setPickupLocationData(location);
      setPickupLocation(location.address);
      console.log('📍 Pickup location set to:', location.address);
    } catch (error) {
      console.error('❌ Error getting current location:', error);
      // Use default Gilgit location
      const defaultLocation = {
        latitude: 35.9208,
        longitude: 74.3144,
        address: 'Gilgit City Center',
      };
      setPickupLocationData(defaultLocation);
      setPickupLocation(defaultLocation.address);
    }
  };

  const handleMapLocationChange = (location: { latitude: number; longitude: number; address: string }) => {
    setDestinationData(location);
    setDestination(location.address);
    console.log('📍 Destination selected on map:', location.address);
  };

  const handleTransportModeSelect = (mode: TransportMode) => {
    setSelectedTransportMode(mode);
    console.log('🚗 Transport mode selected:', mode.name);
  };

  const handleRouteSubmit = async (from: string, to: string) => {
    setPickupLocation(from);
    setDestination(to);
    
    // Add to recent locations if not already present
    if (to && !recentLocations.includes(to)) {
      setRecentLocations(prev => [to, ...prev.slice(0, 6)]);
    }
    
    // Geocode the destination to get coordinates
    try {
      const destinationCoords = await GoogleMapsService.geocodeAddress(to);
      const destinationLocationData = {
        latitude: destinationCoords.lat,
        longitude: destinationCoords.lng,
        address: to,
      };
      setDestinationData(destinationLocationData);
      console.log('📍 Destination coordinates set:', destinationLocationData);
    } catch (error) {
      console.error('❌ Error geocoding destination:', error);
      // Use default Gilgit coordinates as fallback
      const fallbackLocation = {
        latitude: 35.9208,
        longitude: 74.3144,
        address: to,
      };
      setDestinationData(fallbackLocation);
    }
    
    // Also geocode the pickup location if it's different from current
    if (from !== pickupLocation) {
      try {
        const pickupCoords = await GoogleMapsService.geocodeAddress(from);
        const pickupLocationData = {
          latitude: pickupCoords.lat,
          longitude: pickupCoords.lng,
          address: from,
        };
        setPickupLocationData(pickupLocationData);
        console.log('📍 Pickup coordinates set:', pickupLocationData);
      } catch (error) {
        console.error('❌ Error geocoding pickup location:', error);
      }
    }
    
    console.log('📍 Route set:', { from, to });
  };

  // New handler for destination map modal that handles LocationData object
  const handleDestinationSelected = async (destination: LocationData) => {
    console.log('📍 Destination selected from map:', destination);
    
    // Set destination data
    setDestinationData(destination);
    setDestination(destination.address);
    
    // Add to recent locations if not already present
    if (destination.address && !recentLocations.includes(destination.address)) {
      setRecentLocations(prev => [destination.address, ...prev.slice(0, 6)]);
    }
    
    // Close the destination map modal
    setIsDestinationMapVisible(false);
    
    // Check if we have both pickup and destination, then proceed to ride route modal
    if (pickupLocationData && destination) {
      console.log('📍 Both pickup and destination available, proceeding to ride route modal');
      // Show ride route modal
      setShowRideRouteModal(true);
    } else {
      console.log('⚠️ Missing pickup or destination data');
    }
  };

  const handleMapSubmit = () => {
    if (destinationData && selectedTransportMode) {
      handleBookRide();
    } else {
      Alert.alert('Incomplete Selection', 'Please select a transport mode to continue');
    }
  };

  const handleFindDriver = (fare: number, paymentMethod: string, autoAccept: boolean) => {
    console.log('🚗 handleFindDriver called with:', { fare, paymentMethod, autoAccept });
    console.log('🔧 Current state:', { 
      pickupLocationData: !!pickupLocationData, 
      destinationData: !!destinationData,
      modalMounted,
      modalVisible 
    });
    setOfferedFare(fare);
    setPaymentMethod(paymentMethod);
    setAutoAccept(autoAccept);
    openModal();
  };

  // Handler for fare confirmation from OfferFareModal
  const handleFareConfirm = (fare: number, paymentMethod: string, autoAccept: boolean) => {
    console.log('💰 Fare confirmed:', { fare, paymentMethod, autoAccept });
    setOfferedFare(fare);
    setPaymentMethod(paymentMethod);
    setAutoAccept(autoAccept);
    setShowFareOfferingModal(false);
    // Proceed to find drivers
    handleFindDriver(fare, paymentMethod, autoAccept);
  };

  // Handler for ride route modal find driver
  const handleRideRouteFindDriver = (fare: number, paymentMethod: string, autoAccept: boolean) => {
    console.log('🚗 Ride route find driver:', { fare, paymentMethod, autoAccept });
    setOfferedFare(fare);
    setPaymentMethod(paymentMethod);
    setAutoAccept(autoAccept);
    setShowRideRouteModal(false);
    // Proceed to find drivers
    handleFindDriver(fare, paymentMethod, autoAccept);
  };

  const handleDriverOffer = (driverOffer: any) => {
    // Handle driver offer selection
    console.log('Driver offer selected:', driverOffer);
    setDriverOffer(driverOffer);
    setShowRiderOfferModal(true);
  };

  // Handle accepting driver offer
  const handleAcceptDriverOffer = () => {
    if (driverOffer && currentRideRequestId && user) {
      console.log('💰 Accepting driver offer:', driverOffer);
      
      // Send acceptance via WebSocket
      webSocketService.sendFareResponse(currentRideRequestId, user._id, 'accept');
      
      // Close the offer modal
      setShowRiderOfferModal(false);
      setDriverOffer(null);
      
      // Close the finding drivers modal
      closeModal();
      
      // Show success message
      Alert.alert('Ride Accepted', `You have accepted ${driverOffer.driverName}'s offer for PKR ${driverOffer.fareAmount}`);
    }
  };

  // Handle declining driver offer
  const handleDeclineDriverOffer = () => {
    if (driverOffer && currentRideRequestId && user) {
      console.log('💰 Declining driver offer:', driverOffer);
      
      // Send decline via WebSocket
      webSocketService.sendFareResponse(currentRideRequestId, user._id, 'decline');
      
      // Close the offer modal
      setShowRiderOfferModal(false);
      setDriverOffer(null);
      
      // Continue searching for drivers
      // The finding drivers modal should remain open
    }
  };

  // Handle driver offer timeout
  const handleDriverOfferTimeout = () => {
    console.log('⏰ Driver offer timeout - closing modal');
    setShowRiderOfferModal(false);
    setDriverOffer(null);
    closeModal();
  };


  const handleCancelFindingDrivers = () => {
    closeModal();
  };

  const handleCancelRide = async () => {
    try {
      console.log('🔧 handleCancelRide called with:', { currentRideRequestId, token: !!token });
      console.log('🔧 WebSocket connection status:', webSocketService.getConnectionStatus());
      
      // If there's an active ride request, cancel it on the server
      if (currentRideRequestId && token) {
        console.log('🔧 Cancelling ride request:', currentRideRequestId);
        
        const apiConfig = getApiConfig();
        const response = await fetch(`${apiConfig.baseURL}/api/ride-requests/${currentRideRequestId}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('🔧 Cancel response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Ride request cancelled successfully:', result);
          
          // Send WebSocket cancellation event for real-time updates
          if (user) {
            webSocketService.sendRideCancellation(currentRideRequestId, user._id, 'rider');
          }
          
          // Debug: Check the status after cancellation
          try {
            const apiConfig = getApiConfig();
            const debugResponse = await fetch(`${apiConfig.baseURL}/api/ride-requests/${currentRideRequestId}/debug`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (debugResponse.ok) {
              const debugResult = await debugResponse.json();
              console.log('🔍 Debug - Ride request status after cancellation:', debugResult);
            }
          } catch (debugError) {
            console.error('❌ Debug check failed:', debugError);
          }
        } else {
          const error = await response.json();
          console.error('❌ Failed to cancel ride request on server:', error);
          Alert.alert('Error', `Failed to cancel ride: ${error.error || 'Unknown error'}`);
          return; // Don't reset states if cancellation failed
        }
      } else {
        console.log('⚠️ No active ride request to cancel or no token');
      }
    } catch (error) {
      console.error('❌ Error cancelling ride request:', error);
      Alert.alert('Error', 'Network error while cancelling ride. Please try again.');
      return; // Don't reset states if there was an error
    } finally {
      // Reset all ride-related states
      console.log('🔧 Resetting ride states');
      closeModal();
      setOfferedFare(null);
      setPaymentMethod('cash');
      setAutoAccept(false);
      setDestination('');
      setDestinationData(null);
      setSelectedTransportMode(null);
      setCurrentRideRequestId(null);
      
      Alert.alert(
        'Ride Cancelled',
        'Your ride request has been cancelled successfully.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleBookRide = async () => {
    if (!pickupLocationData || !destinationData) {
      Alert.alert('Error', 'Please select both pickup and destination locations');
      return;
    }

    if (!selectedTransportMode) {
      Alert.alert('Error', 'Please select a transport mode');
      return;
    }

    setIsSearching(true);
    
    try {
      // Create ride request
      const apiConfig = getApiConfig();
      const response = await fetch(`${apiConfig.baseURL}/api/ride-requests/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          pickupLocation: pickupLocationData,
          destination: destinationData,
          transportMode: selectedTransportMode.id,
          requestedPrice: selectedTransportMode.basePrice,
          notes: '',
          vehicleType: selectedTransportMode.id,
          paymentMethod: 'cash',
          isUrgent: false,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the ride request ID for potential cancellation
        setCurrentRideRequestId(data.rideRequest.id);
        
        // Navigate to request status screen
        navigation.navigate('RequestStatus' as never, {
          requestId: data.rideRequest.id,
          pickupLocation: pickupLocationData,
          destination: destinationData,
          transportMode: selectedTransportMode,
        } as never);
      } else {
        Alert.alert('Error', data.error || 'Failed to create ride request');
      }
    } catch (error) {
      console.error('Error creating ride request:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Interactive Map Section */}
      <Animated.View style={[
        styles.mapSection,
        { height: mapHeightAnim },
        isMapInteracting && { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 },
      ]}>
        <InteractiveRideMap
          onLocationChange={handleMapLocationChange}
          onSubmit={handleMapSubmit}
          showSubmitButton={!!(destinationData && selectedTransportMode)}
          selectedTransportMode={selectedTransportMode}
          onInteractionStart={() => setIsMapInteracting(true)}
          onInteractionEnd={() => setIsMapInteracting(false)}
          isFullscreen={isMapInteracting}
        />
      </Animated.View>

      {/* Transport Mode Selector */}
      <Animated.View pointerEvents={isMapInteracting ? 'none' : 'auto'} style={[
        styles.transportSection,
        { backgroundColor: theme.colors.surface },
        { opacity: sectionsOpacity, transform: [{ translateY: sectionsTranslateY }] },
      ]}> 
        <TransportModeSelector
          onModeSelect={handleTransportModeSelect}
          selectedMode={selectedTransportMode}
        />
      </Animated.View>

      {/* Bottom Section with Search and Recent Locations */}
      <Animated.View pointerEvents={isMapInteracting ? 'none' : 'auto'} style={[
        styles.bottomSection,
        { backgroundColor: theme.colors.surface, paddingBottom: insets.bottom + 20, paddingTop: 20 },
        { opacity: sectionsOpacity, transform: [{ translateY: sectionsTranslateY }] },
      ]}> 
        {/* Where to & for how much Button */}
        <Surface style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
          <TouchableOpacity
            style={styles.searchInput}
            onPress={() => setShowRouteModal(true)}
          >
            <Ionicons name="search" size={20} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.searchPlaceholder, { color: theme.colors.onSurfaceVariant }]}>
              Where to & for how much?
            </Text>
          </TouchableOpacity>
        </Surface>

        {/* Recent Destinations */}
        <ScrollView style={styles.recentDestinations} showsVerticalScrollIndicator={false}>
          {recentLocations.map((location, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.recentDestinationItem}
              onPress={() => {
                setDestination(location);
                // You could also set coordinates for this location
              }}
            >
              <Ionicons name="time-outline" size={20} color={theme.colors.onSurfaceVariant} />
              <View style={styles.recentDestinationText}>
                <Text style={[styles.recentDestinationTitle, { color: theme.colors.onSurface }]}>
                  {location}
                </Text>
                {index === 0 && (
                  <Text style={[styles.recentDestinationSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Khudadad Height, Main Margalla Ro...
                  </Text>
                )}
                {index === 3 && (
                  <Text style={[styles.recentDestinationSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    I-8/1 I 8/1 I-8, Islamabad
                  </Text>
                )}
                {index === 4 && (
                  <Text style={[styles.recentDestinationSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Management and Perseverance of Forestry (NG...
                  </Text>
                )}
                {index === 5 && (
                  <Text style={[styles.recentDestinationSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    I-10/2 I 10/2 I-10, Islamabad
                  </Text>
                )}
                {index === 6 && (
                  <Text style={[styles.recentDestinationSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Westridge 1
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Route Status Display */}
        {(pickupLocation || destination) && (
          <View style={styles.routeStatus} />
        )}
      </Animated.View>

      {/* Route Entry Modal */}
      <RouteEntryModal
        visible={showRouteModal}
        onClose={() => setShowRouteModal(false)}
        onSubmit={handleRouteSubmit}
        initialFrom={destination || pickupLocation}
        onChooseOnMap={() => setIsDestinationMapVisible(true)}
      />

      {/* Destination Map Modal */}
      <DestinationMapModal
        visible={isDestinationMapVisible}
        onClose={() => setIsDestinationMapVisible(false)}
        onDone={handleDestinationSelected}
        fromLocation={pickupLocation}
        fromCoordinates={pickupLocationData}
        selectedTransportMode={selectedTransportMode}
      />

      {/* Finding Drivers Modal - iOS fix applied */}
      {(() => {
        const shouldShowModal = modalMounted && pickupLocationData;
        console.log('🔧 Modal visibility check:', {
          pickupLocationData: !!pickupLocationData,
          destinationData: !!destinationData,
          modalMounted,
          shouldShowModal,
          modalVisible
        });
        return shouldShowModal;
      })() && (
        <FindingDriversModal
          key={`modal-${modalKey}`}
          visible={modalVisible}
          onClose={handleCancelFindingDrivers}
          onCancelRide={handleCancelRide}
          pickupLocation={pickupLocationData}
          destination={destinationData}
          offeredFare={offeredFare || 100}
          paymentMethod={paymentMethod}
          autoAccept={autoAccept}
          rideRequestId={currentRideRequestId}
          onRideRequestIdChange={setCurrentRideRequestId}
          onDriverOffer={handleDriverOffer}
        />
      )}

      {/* Rider Offer Modal */}
      {driverOffer && (
        <RiderOfferModal
          visible={showRiderOfferModal}
          onClose={() => setShowRiderOfferModal(false)}
          onAccept={handleAcceptDriverOffer}
          onDecline={handleDeclineDriverOffer}
          onTimeout={handleDriverOfferTimeout}
          driverName={driverOffer.driverName}
          driverRating={driverOffer.driverRating}
          fareAmount={driverOffer.fareAmount}
          arrivalTime={driverOffer.arrivalTime}
          vehicleInfo={driverOffer.vehicleInfo}
        />
      )}

      {/* Offer Fare Modal */}
      <OfferFareModal
        visible={showFareOfferingModal}
        onClose={() => setShowFareOfferingModal(false)}
        onConfirmFare={handleFareConfirm}
        vehicleType={selectedTransportMode?.id || 'car'}
        distance={0} // We can calculate this if needed
        baseFare={selectedTransportMode?.basePrice || 100}
      />

      {/* Ride Route Modal */}
      {pickupLocationData && destinationData && (
        <RiderRouteModal
          visible={showRideRouteModal}
          onClose={() => setShowRideRouteModal(false)}
          pickupLocation={pickupLocationData}
          destination={destinationData}
          onFindDriver={handleRideRouteFindDriver}
          selectedTransportMode={selectedTransportMode}
        />
      )}
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapSection: {
    height: height * 0.5, // Default height; goes fullscreen during interaction
  },
  transportSection: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    minHeight: 100,
    zIndex: 10,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  bottomSection: {
    flex: 1,
    paddingTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    zIndex: 1,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 25,
    padding: 4,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
    fontWeight: '500',
  },
  recentDestinations: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  recentDestinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  recentDestinationText: {
    flex: 1,
  },
  recentDestinationTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  recentDestinationSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  routeStatus: {
    height: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  routeStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
});

export default RiderScreen;
