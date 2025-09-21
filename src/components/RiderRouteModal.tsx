import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import RouteMapView from './RouteMapView';

const { width, height } = Dimensions.get('window');

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

interface RiderRouteModalProps {
  visible: boolean;
  onClose: () => void;
  pickupLocation: LocationData;
  destination: LocationData;
  onFindDriver: (fare: number, paymentMethod: string, autoAccept: boolean) => void;
  selectedTransportMode?: {
    id: string;
    name: string;
    icon: string;
    capacity: number;
    basePrice: number;
  } | null;
}

const RiderRouteModal: React.FC<RiderRouteModalProps> = ({
  visible,
  onClose,
  pickupLocation,
  destination,
  onFindDriver,
  selectedTransportMode,
}) => {
  const { theme } = useTheme();

  const handleFindDriver = (fare: number, paymentMethod: string, autoAccept: boolean) => {
    onFindDriver(fare, paymentMethod, autoAccept);
    onClose();
  };

  const handleBack = () => {
    onClose();
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
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Ride Route
          </Text>
          <View style={styles.placeholder} />
        </Surface>

        {/* Route Map View */}
        <RouteMapView
          pickupLocation={pickupLocation}
          destination={destination}
          onFindDriver={handleFindDriver}
          onBack={handleBack}
          vehicleType={selectedTransportMode?.id as 'bike' | 'car' | 'truck' || 'car'}
          selectedTransportMode={selectedTransportMode}
        />
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
});

export default RiderRouteModal;
