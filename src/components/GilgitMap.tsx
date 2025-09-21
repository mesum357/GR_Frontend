import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

// Popular locations in Gilgit (simplified)
const POPULAR_LOCATIONS = [
  {
    id: 1,
    name: 'Gilgit Airport',
    type: 'airport',
    description: 'Gilgit-Baltistan Airport',
  },
  {
    id: 2,
    name: 'Gilgit Bazaar',
    type: 'shopping',
    description: 'Main shopping area',
  },
  {
    id: 3,
    name: 'Gilgit Hospital',
    type: 'hospital',
    description: 'District Headquarters Hospital',
  },
  {
    id: 4,
    name: 'Gilgit University',
    type: 'education',
    description: 'University of Gilgit-Baltistan',
  },
  {
    id: 5,
    name: 'Gilgit Bus Terminal',
    type: 'transport',
    description: 'Main bus terminal',
  },
  {
    id: 6,
    name: 'Gilgit Fort',
    type: 'landmark',
    description: 'Historical Gilgit Fort',
  },
];

interface GilgitMapProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
  selectedLocation?: { latitude: number; longitude: number; address: string } | null;
  pickupLocation?: { latitude: number; longitude: number; address: string } | null;
}

const GilgitMap: React.FC<GilgitMapProps> = ({
  onLocationSelect,
  selectedLocation,
  pickupLocation,
}) => {
  const { theme } = useTheme();

  // Handle location selection (simplified)
  const handleLocationSelect = (location: any) => {
    // For now, just use the location name as address
    onLocationSelect({
      latitude: 35.9208, // Default Gilgit coordinates
      longitude: 74.3144,
      address: location.name,
    });
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'airport':
        return 'airplane';
      case 'shopping':
        return 'bag';
      case 'hospital':
        return 'medical';
      case 'education':
        return 'school';
      case 'transport':
        return 'bus';
      case 'landmark':
        return 'location';
      default:
        return 'location';
    }
  };

  const getLocationColor = (type: string) => {
    switch (type) {
      case 'airport':
        return '#2196F3';
      case 'shopping':
        return '#4CAF50';
      case 'hospital':
        return '#F44336';
      case 'education':
        return '#9C27B0';
      case 'transport':
        return '#FF9800';
      case 'landmark':
        return '#795548';
      default:
        return theme.colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      <View style={[styles.mapPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={styles.mapContent}>
          <Ionicons name="map" size={48} color={theme.colors.primary} />
          <Text style={[styles.mapTitle, { color: theme.colors.onSurface }]}>
            Gilgit City Map
          </Text>
          <Text style={[styles.mapSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Interactive map will be available soon
          </Text>
          
          {/* Current Location Indicator */}
          <View style={styles.currentLocationIndicator}>
            <Ionicons name="location" size={20} color="#2196F3" />
            <Text style={[styles.locationText, { color: theme.colors.onSurface }]}>
              Current Location: Gilgit City Center
            </Text>
          </View>

          {/* Selected Location Indicator */}
          {selectedLocation && (
            <View style={styles.selectedLocationIndicator}>
              <Ionicons name="location" size={20} color="#F44336" />
              <Text style={[styles.locationText, { color: theme.colors.onSurface }]}>
                Selected: {selectedLocation.address}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Location Info Panel */}
      <View style={[styles.infoPanel, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.infoTitle, { color: theme.colors.onSurface }]}>
          Select Your Destination
        </Text>
        
        <Text style={[styles.infoDescription, { color: theme.colors.onSurfaceVariant }]}>
          Choose from popular locations in Gilgit or enter manually
        </Text>
      </View>

      {/* Popular Locations List */}
      <ScrollView style={styles.popularLocationsList} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Popular Locations in Gilgit
        </Text>
        
        {POPULAR_LOCATIONS.map((location) => (
          <TouchableOpacity
            key={location.id}
            style={[styles.locationItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleLocationSelect(location)}
          >
            <View style={[styles.locationIcon, { backgroundColor: getLocationColor(location.type) }]}>
              <Ionicons 
                name={getLocationIcon(location.type) as any} 
                size={20} 
                color="white" 
              />
            </View>
            <View style={styles.locationDetails}>
              <Text style={[styles.locationName, { color: theme.colors.onSurface }]}>
                {location.name}
              </Text>
              <Text style={[styles.locationDescription, { color: theme.colors.onSurfaceVariant }]}>
                {location.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapPlaceholder: {
    height: 250,
    borderRadius: 16,
    margin: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mapContent: {
    alignItems: 'center',
    padding: 20,
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  currentLocationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedLocationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  infoPanel: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
  },
  popularLocationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationDescription: {
    fontSize: 14,
  },
});

export default GilgitMap;
