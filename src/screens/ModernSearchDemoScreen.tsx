import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import ModernSearchBar from '../components/ModernSearchBar';

const ModernSearchDemoScreen: React.FC = () => {
  const { theme } = useTheme();
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');

  const handleSearch = () => {
    if (!fromLocation.trim() || !toLocation.trim()) {
      Alert.alert('Incomplete Selection', 'Please select both pickup and destination locations');
      return;
    }
    
    Alert.alert(
      'Route Selected',
      `From: ${fromLocation}\nTo: ${toLocation}`,
      [{ text: 'OK' }]
    );
  };

  const handleClear = () => {
    setFromLocation('');
    setToLocation('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Modern Search Bar
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Gilgit-Baltistan Locations
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <ModernSearchBar
            fromValue={fromLocation}
            toValue={toLocation}
            onFromChange={setFromLocation}
            onToChange={setToLocation}
            placeholder={{
              from: 'Pickup location',
              to: 'Where to?',
            }}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSearch}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={20} color="white" />
            <Text style={styles.searchButtonText}>Search Route</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.clearButton, { borderColor: theme.colors.outline }]}
            onPress={handleClear}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color={theme.colors.onSurface} />
            <Text style={[styles.clearButtonText, { color: theme.colors.onSurface }]}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={[styles.featuresTitle, { color: theme.colors.onBackground }]}>
            Features
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              <Text style={[styles.featureText, { color: theme.colors.onSurface }]}>
                Instant autocomplete with 100+ Gilgit-Baltistan locations
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              <Text style={[styles.featureText, { color: theme.colors.onSurface }]}>
                Smooth fade and slide animations
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              <Text style={[styles.featureText, { color: theme.colors.onSurface }]}>
                Modern UI with rounded inputs and shadows
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              <Text style={[styles.featureText, { color: theme.colors.onSurface }]}>
                Green accent colors for focus states
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              <Text style={[styles.featureText, { color: theme.colors.onSurface }]}>
                Fully responsive for iOS and Android
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              <Text style={[styles.featureText, { color: theme.colors.onSurface }]}>
                Location swap functionality
              </Text>
            </View>
          </View>
        </View>

        {/* Dataset Info */}
        <View style={styles.datasetContainer}>
          <Text style={[styles.datasetTitle, { color: theme.colors.onBackground }]}>
            Dataset Includes
          </Text>
          
          <View style={styles.datasetGrid}>
            <View style={styles.datasetCategory}>
              <Text style={[styles.categoryTitle, { color: theme.colors.primary }]}>
                Cities & Towns
              </Text>
              <Text style={[styles.categoryText, { color: theme.colors.onSurface }]}>
                Gilgit, Skardu, Hunza, Nagar, Astore, Diamer, Ghizer, Gupis, Ishkoman, Jaglot, Khaplu, Minimarg, Passu, Rakaposhi, Shigar, Tashkurgan, Yasin, Chitral
              </Text>
            </View>
            
            <View style={styles.datasetCategory}>
              <Text style={[styles.categoryTitle, { color: theme.colors.primary }]}>
                Landmarks & Tourist Spots
              </Text>
              <Text style={[styles.categoryText, { color: theme.colors.onSurface }]}>
                Baltit Fort, Hunza Valley, Karakoram Highway, K2 Base Camp, Fairy Meadows, Deosai National Park, Attabad Lake, Rush Lake, Batura Glacier, Hispar Glacier
              </Text>
            </View>
            
            <View style={styles.datasetCategory}>
              <Text style={[styles.categoryTitle, { color: theme.colors.primary }]}>
                Services & Facilities
              </Text>
              <Text style={[styles.categoryText, { color: theme.colors.onSurface }]}>
                Airports, Universities, Hospitals, Markets, Restaurants, Hotels, Banks, Sports Complexes, Government Offices
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  datasetContainer: {
    marginBottom: 20,
  },
  datasetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  datasetGrid: {
    gap: 20,
  },
  datasetCategory: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ModernSearchDemoScreen;


