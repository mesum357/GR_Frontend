import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { GoogleMapsService } from '../services/GoogleMapsService';
import ArrivalTimeModal from './ArrivalTimeModal';
import FareOfferModal from './FareOfferModal';
import { webSocketService } from '../services/WebSocketService';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

interface RideRequest {
  _id: string;
  pickupLocationDetails: {
    address: string;
    coordinates: [number, number];
  };
  destinationDetails: {
    address: string;
    coordinates: [number, number];
  };
  requestedPrice: number;
  estimatedFare: number;
  estimatedDuration: number;
  estimatedDistance: number;
  paymentMethod: string;
  riderName: string;
  riderPhone: string;
  status: string;
  createdAt: string;
}

interface RideRouteModalProps {
  visible: boolean;
  onClose: () => void;
  onSkip: () => void; // New prop for skip functionality
  rideRequest: RideRequest | null;
  onAccept: (requestId: string, fare: number) => void;
  onOfferFare: (requestId: string, fare: number) => void;
}

const RideRouteModal: React.FC<RideRouteModalProps> = ({
  visible,
  onClose,
  onSkip,
  rideRequest,
  onAccept,
  onOfferFare,
}) => {
  const { user } = useAuth();
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [offeredFare, setOfferedFare] = useState(0);
  const [showArrivalTimeModal, setShowArrivalTimeModal] = useState(false);
  const [showFareOfferModal, setShowFareOfferModal] = useState(false);
  const [selectedArrivalTime, setSelectedArrivalTime] = useState(0);
  const [selectedFareAmount, setSelectedFareAmount] = useState(0);
  const [isAcceptFlow, setIsAcceptFlow] = useState(false); // Track if this is accept flow
  const [fareResponse, setFareResponse] = useState<{
    action: 'accept' | 'decline';
    timestamp: number;
  } | null>(null);
  const isFareOfferModalOpenRef = useRef(false);
  const isClosingRef = useRef(false);

  // Calculate map region to fit both pickup and destination
  const mapRegion = rideRequest ? (() => {
    const pickupLat = rideRequest.pickupLocationDetails.coordinates[1];
    const pickupLng = rideRequest.pickupLocationDetails.coordinates[0];
    const destLat = rideRequest.destinationDetails.coordinates[1];
    const destLng = rideRequest.destinationDetails.coordinates[0];
    
    // Calculate center point
    const centerLat = (pickupLat + destLat) / 2;
    const centerLng = (pickupLng + destLng) / 2;
    
    // Calculate deltas to fit both points with some padding
    const latDelta = Math.abs(pickupLat - destLat) * 1.5 + 0.01;
    const lngDelta = Math.abs(pickupLng - destLng) * 1.5 + 0.01;
    
    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  })() : null;

  useEffect(() => {
    if (visible && rideRequest) {
      // Reset closing flag when modal opens
      isClosingRef.current = false;
      setOfferedFare(rideRequest.requestedPrice);
      fetchRoute();
    }
  }, [visible, rideRequest]);

  // WebSocket event listeners
  useEffect(() => {
    if (visible && user) {
      // Authenticate with WebSocket
      webSocketService.authenticate(user._id, 'driver');

      // Listen for fare responses from rider
      const handleFareResponse = (data: any) => {
        console.log('💰 Received fare response:', data);
        setFareResponse(data);
        
        if (data.action === 'accept') {
          // Close the fare offer modal and proceed with ride
          console.log('💰 Rider accepted offer, closing modal');
          isFareOfferModalOpenRef.current = false;
          setShowFareOfferModal(false);
          onClose();
        } else if (data.action === 'decline') {
          // Close the fare offer modal and return to ride requests
          console.log('💰 Rider declined offer, closing modal');
          isFareOfferModalOpenRef.current = false;
          setShowFareOfferModal(false);
          onClose();
        }
      };

      // Listen for fare response timeout
      const handleFareResponseTimeout = (data: any) => {
        console.log('⏰ Fare response timeout:', data);
        
        // Prevent multiple close calls
        if (isClosingRef.current) {
          console.log('🔧 Modal already closing, ignoring timeout close call');
          return;
        }
        
        isClosingRef.current = true;
        isFareOfferModalOpenRef.current = false;
        setShowFareOfferModal(false);
        onClose(); // Return to ride requests page
        Alert.alert('Timeout', 'Rider did not respond within 15 seconds. Returning to ride requests.');
      };

      webSocketService.on('fare_response', handleFareResponse);
      webSocketService.on('fare_response_timeout', handleFareResponseTimeout);

      return () => {
        webSocketService.off('fare_response', handleFareResponse);
        webSocketService.off('fare_response_timeout', handleFareResponseTimeout);
      };
    }
  }, [visible, user, onClose]);

  const fetchRoute = async () => {
    if (!rideRequest) return;

    // Validate coordinates
    const pickupCoords = rideRequest.pickupLocationDetails.coordinates;
    const destCoords = rideRequest.destinationDetails.coordinates;
    
    if (!pickupCoords || !destCoords || 
        pickupCoords.length !== 2 || destCoords.length !== 2 ||
        pickupCoords[0] === 0 || pickupCoords[1] === 0 ||
        destCoords[0] === 0 || destCoords[1] === 0) {
      console.error('❌ Invalid coordinates:', { pickupCoords, destCoords });
      return;
    }

    console.log('🗺️ Fetching route for:', {
      pickup: pickupCoords,
      destination: destCoords,
      pickupAddress: rideRequest.pickupLocationDetails.address,
      destinationAddress: rideRequest.destinationDetails.address,
      pickupDetails: rideRequest.pickupLocationDetails,
      destinationDetails: rideRequest.destinationDetails,
      fullRideRequest: rideRequest
    });

    setIsLoadingRoute(true);
    try {
      const route = await GoogleMapsService.getRoute(
        rideRequest.pickupLocationDetails.coordinates,
        rideRequest.destinationDetails.coordinates
      );
      console.log('🗺️ Route fetched successfully:', route.length, 'points');
      setRouteCoordinates(route);
    } catch (error) {
      console.error('❌ Error fetching route:', error);
      // Create a fallback straight-line route
      const fallbackRoute = [
        {
          latitude: rideRequest.pickupLocationDetails.coordinates[1],
          longitude: rideRequest.pickupLocationDetails.coordinates[0]
        },
        {
          latitude: rideRequest.destinationDetails.coordinates[1],
          longitude: rideRequest.destinationDetails.coordinates[0]
        }
      ];
      console.log('🗺️ Using fallback straight-line route:', fallbackRoute.length, 'points');
      setRouteCoordinates(fallbackRoute);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const handleAccept = () => {
    if (rideRequest) {
      console.log('🔧 Accept button pressed, showing arrival time modal');
      setIsAcceptFlow(true);
      setSelectedFareAmount(rideRequest.requestedPrice);
      setShowArrivalTimeModal(true);
    }
  };

  const handleOfferFare = () => {
    console.log('🔧 handleOfferFare called:', { 
      rideRequest: !!rideRequest, 
      offeredFare, 
      rideRequestId: rideRequest?._id 
    });
    
    if (rideRequest && offeredFare > 0) {
      console.log('🔧 Setting selected fare amount and showing arrival time modal');
      setIsAcceptFlow(false); // This is offer flow
      setSelectedFareAmount(offeredFare);
      setShowArrivalTimeModal(true);
    } else {
      console.log('🔧 Cannot offer fare:', { 
        hasRideRequest: !!rideRequest, 
        offeredFare 
      });
    }
  };

  const handleArrivalTimeSelected = (minutes: number) => {
    console.log('🔧 Arrival time selected:', { minutes, selectedFareAmount, isAcceptFlow });
    setSelectedArrivalTime(minutes);
    setShowArrivalTimeModal(false);
    
    // Prevent opening multiple modals using ref for immediate check
    if (isFareOfferModalOpenRef.current) {
      console.log('🔧 FareOfferModal already open, ignoring request');
      return;
    }
    
    isFareOfferModalOpenRef.current = true;
    setShowFareOfferModal(true);
    console.log('🔧 FareOfferModal should now be visible');
    
    if (rideRequest && user) {
      if (isAcceptFlow) {
        // For accept flow, send fare offer via WebSocket AND call API
        console.log('🔧 Accept flow - sending fare offer via WebSocket:', { 
          rideRequestId: rideRequest._id, 
          fareAmount: selectedFareAmount 
        });
        
        // Send fare offer to rider via WebSocket for real-time communication
        webSocketService.sendFareOffer(
          rideRequest._id,
          user._id,
          {
            driverName: user.name || 'Driver',
            driverRating: 4.5,
            fareAmount: selectedFareAmount,
            arrivalTime: minutes,
            vehicleInfo: 'Standard Vehicle'
          }
        );
        
        // Call API for database update (with error handling for race conditions)
        try {
          onAccept(rideRequest._id, selectedFareAmount);
        } catch (error) {
          console.log('⚠️ API call failed, but WebSocket message sent:', error);
        }
      } else {
        // For offer flow, send fare offer via WebSocket
        console.log('🔧 Offer flow - sending fare offer via WebSocket:', { 
          rideRequestId: rideRequest._id, 
          fareAmount: selectedFareAmount 
        });
        
        // Send fare offer to rider via WebSocket
        webSocketService.sendFareOffer(
          rideRequest._id,
          user._id,
          {
            driverName: user.name || 'Driver',
            driverRating: 4.5, // Default rating, should come from user profile
            fareAmount: selectedFareAmount,
            arrivalTime: minutes,
            vehicleInfo: 'Standard Vehicle' // Should come from driver profile
          }
        );
        
        // Also call the original onOfferFare for backward compatibility
        onOfferFare(rideRequest._id, selectedFareAmount);
      }
    }
  };

  const handleFareOfferClose = () => {
    isFareOfferModalOpenRef.current = false;
    setShowFareOfferModal(false);
    onClose();
  };

  const handleFareOfferComplete = () => {
    console.log('🔧 Fare offer completed, closing modal');
    
    // Prevent multiple close calls
    if (isClosingRef.current) {
      console.log('🔧 Modal already closing, ignoring duplicate close call');
      return;
    }
    
    isClosingRef.current = true;
    isFareOfferModalOpenRef.current = false;
    setShowFareOfferModal(false);
    
    // Close the modal immediately
    console.log('🔧 Calling onClose after fare offer completion');
    onClose();
  };

  const adjustFare = (amount: number) => {
    setOfferedFare(prev => Math.max(0, prev + amount));
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {!rideRequest ? (
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ride Details</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading ride details...</Text>
          </View>
        </View>
      ) : (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ride Details</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Map Section */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            showsScale={false}
            showsTraffic={false}
            showsIndoors={false}
            showsBuildings={true}
            showsPointsOfInterest={true}
            mapType="standard"
            pitchEnabled={true}
            rotateEnabled={true}
            initialRegion={mapRegion}
            camera={{
              center: {
                latitude: (rideRequest.pickupLocationDetails.coordinates[1] + rideRequest.destinationDetails.coordinates[1]) / 2,
                longitude: (rideRequest.pickupLocationDetails.coordinates[0] + rideRequest.destinationDetails.coordinates[0]) / 2,
              },
              pitch: 0,
              heading: 0,
              altitude: 2000,
              zoom: 15,
            }}
          >
            {/* Pickup Marker */}
            <Marker
              coordinate={{
                latitude: rideRequest.pickupLocationDetails.coordinates[1],
                longitude: rideRequest.pickupLocationDetails.coordinates[0],
              }}
              title="Pickup Location"
              description={rideRequest.pickupLocationDetails.address}
            >
              <View style={styles.pickupMarker}>
                <Text style={styles.markerText}>A</Text>
              </View>
            </Marker>

            {/* Destination Marker */}
            <Marker
              coordinate={{
                latitude: rideRequest.destinationDetails.coordinates[1],
                longitude: rideRequest.destinationDetails.coordinates[0],
              }}
              title="Destination"
              description={rideRequest.destinationDetails.address}
            >
              <View style={styles.destinationMarker}>
                <Text style={styles.markerText}>B</Text>
              </View>
            </Marker>

            {/* Route Polyline */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#4CAF50"
                strokeWidth={5}
                lineDashPattern={[5, 5]}
                lineCap="round"
                lineJoin="round"
              />
            )}
            
            {/* Loading indicator for route */}
            {isLoadingRoute && (
              <View style={styles.routeLoadingOverlay}>
                <Text style={styles.routeLoadingText}>Loading route...</Text>
              </View>
            )}
          </MapView>

          {/* Map Overlay Info - Pickup */}
          <View style={styles.pickupOverlay}>
            <View style={styles.overlayBubble}>
              <Text style={styles.overlayTime}>{formatTime(rideRequest.estimatedDuration)}</Text>
              <Text style={styles.overlayDistance}>{formatDistance(rideRequest.estimatedDistance)}</Text>
            </View>
          </View>

          {/* Map Overlay Info - Destination */}
          <View style={styles.destinationOverlay}>
            <View style={[styles.overlayBubble, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.overlayTime}>{formatTime(rideRequest.estimatedDuration)}</Text>
              <Text style={styles.overlayDistance}>{formatDistance(rideRequest.estimatedDistance)}</Text>
            </View>
          </View>

          {/* Zoom Controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.zoomButton}>
              <Text style={styles.zoomText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton}>
              <Text style={styles.zoomText}>-</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Sheet */}
        <View style={styles.bottomSheet}>
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Ride Details */}
            <View style={styles.rideDetails}>
              <View style={styles.riderProfile}>
                <View style={styles.riderAvatar}>
                  <Ionicons name="person" size={24} color="white" />
                </View>
                <View style={styles.riderInfo}>
                  <Text style={styles.riderName}>{rideRequest.riderName}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>4.7 (46)</Text>
                  </View>
                </View>
                <View style={styles.fareDisplay}>
                  <Text style={styles.fareAmount}>PKR {rideRequest.requestedPrice}</Text>
                </View>
              </View>

              <View style={styles.locationDetails}>
                <View style={styles.locationItem}>
                  <View style={styles.locationMarker}>
                    <Text style={styles.locationMarkerText}>A</Text>
                  </View>
                  <Text style={styles.locationAddress}>
                    {rideRequest.pickupLocationDetails.address}
                  </Text>
                </View>

                <View style={styles.locationItem}>
                  <View style={[styles.locationMarker, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.locationMarkerText}>B</Text>
                  </View>
                  <Text style={styles.locationAddress}>
                    {rideRequest.destinationDetails.address}
                  </Text>
                </View>
              </View>
            </View>

            {/* Fare Section */}
            <View style={styles.fareSection}>
              <View style={styles.fareDisplay}>
                <Text style={styles.fareLabel}>Requested Fare</Text>
                <Text style={styles.fareAmount}>PKR {rideRequest.requestedPrice}</Text>
              </View>

              <View style={styles.offerFareSection}>
                <Text style={styles.offerLabel}>Offer your fare:</Text>
                <View style={styles.fareOptions}>
                  <TouchableOpacity
                    style={[styles.fareOptionButton, offeredFare === rideRequest.requestedPrice + 15 && styles.selectedFareOption]}
                    onPress={() => setOfferedFare(rideRequest.requestedPrice + 15)}
                  >
                    <Text style={styles.fareOptionText}>PKR {rideRequest.requestedPrice + 15}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.fareOptionButton, offeredFare === rideRequest.requestedPrice + 30 && styles.selectedFareOption]}
                    onPress={() => setOfferedFare(rideRequest.requestedPrice + 30)}
                  >
                    <Text style={styles.fareOptionText}>PKR {rideRequest.requestedPrice + 30}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.fareOptionButton, offeredFare === rideRequest.requestedPrice + 50 && styles.selectedFareOption]}
                    onPress={() => setOfferedFare(rideRequest.requestedPrice + 50)}
                  >
                    <Text style={styles.fareOptionText}>PKR {rideRequest.requestedPrice + 50}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.customFareButton}
                    onPress={() => {
                      // Custom fare input logic
                      const newFare = rideRequest.requestedPrice + 25;
                      setOfferedFare(newFare);
                    }}
                  >
                    <Ionicons name="pencil" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAccept}
              >
                <Text style={styles.acceptButtonText}>
                  Accept for PKR {rideRequest.requestedPrice}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.offerButton,
                  offeredFare <= 0 && styles.disabledButton
                ]}
                onPress={handleOfferFare}
                disabled={offeredFare <= 0}
              >
                <Text style={[
                  styles.offerButtonText,
                  offeredFare <= 0 && styles.disabledButtonText
                ]}>
                  Offer PKR {offeredFare}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={onSkip}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
      )}

      {/* Arrival Time Modal */}
      <ArrivalTimeModal
        visible={showArrivalTimeModal}
        onClose={() => setShowArrivalTimeModal(false)}
        onTimeSelected={handleArrivalTimeSelected}
      />

      {/* Fare Offer Modal */}
      <FareOfferModal
        visible={showFareOfferModal}
        onClose={handleFareOfferClose}
        onComplete={handleFareOfferComplete}
        fareAmount={selectedFareAmount}
        arrivalTime={selectedArrivalTime}
      />

    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#1C1C1E',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  rideInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
  },
  pickupMarker: {
    backgroundColor: '#2196F3',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  destinationMarker: {
    backgroundColor: '#4CAF50',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  markerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomSheet: {
    height: height * 0.45,
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  rideDetails: {
    marginBottom: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  locationMarker: {
    backgroundColor: '#4CAF50',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  locationMarkerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
  },
  riderAvatar: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  riderPhone: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 4,
  },
  fareSection: {
    marginBottom: 20,
  },
  fareDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  fareLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  offerFareSection: {
    marginBottom: 15,
  },
  offerLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 10,
  },
  fareAdjustment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButton: {
    backgroundColor: '#333',
    width: 50,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fareInput: {
    backgroundColor: '#333',
    marginHorizontal: 15,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  fareInputText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    marginBottom: 20,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  offerButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    opacity: 0.8,
  },
  offerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#666666',
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#999999',
  },
  fareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  fareOptionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  selectedFareOption: {
    backgroundColor: '#2E7D32',
  },
  fareOptionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  customFareButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: '#666',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  skipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // New map overlay styles
  pickupOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  destinationOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  overlayBubble: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  overlayTime: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  overlayDistance: {
    color: 'white',
    fontSize: 10,
    marginTop: 2,
  },
  zoomControls: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'column',
  },
  zoomButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoomText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Updated bottom sheet styles
  riderProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  riderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    color: '#9E9E9E',
    fontSize: 12,
    marginLeft: 4,
  },
  fareDisplay: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  locationDetails: {
    marginBottom: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationMarkerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationAddress: {
    fontSize: 14,
    color: 'white',
    flex: 1,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  routeLoadingOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  routeLoadingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RideRouteModal;
