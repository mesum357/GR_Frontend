import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { Text, TextInput, Surface, IconButton, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GoogleMapsService } from '../services/GoogleMapsService';

const { width, height } = Dimensions.get('window');

interface RouteEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (from: string, to: string) => void;
  initialFrom?: string;
  onChooseOnMap?: () => void;
}

import { AutocompletePrediction } from '../services/GoogleMapsService';

const RouteEntryModal: React.FC<RouteEntryModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialFrom = '',
  onChooseOnMap,
}) => {
  const { theme } = useTheme();
  
  const [fromLocation, setFromLocation] = useState(initialFrom);
  const [toLocation, setToLocation] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<AutocompletePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeInput, setActiveInput] = useState<'from' | 'to' | null>(null);

  useEffect(() => {
    setFromLocation(initialFrom);
  }, [initialFrom]);

  const handleSearch = async (query: string, inputType: 'from' | 'to') => {
    if (query.length < 1) {
      setSearchSuggestions([]);
      return;
    }

    setIsSearching(true);
    setActiveInput(inputType);

    try {
      // Use Google Places Autocomplete API
      const suggestions = await GoogleMapsService.getPlaceAutocomplete(query);
      setSearchSuggestions(suggestions);
    } catch (error) {
      console.error('Error searching places:', error);
      setSearchSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionSelect = async (suggestion: AutocompletePrediction) => {
    try {
      // Get place details to get coordinates
      const placeDetails = await GoogleMapsService.getPlaceDetails(suggestion.place_id);
      
      if (activeInput === 'from') {
        setFromLocation(suggestion.description);
        // Store coordinates for from location if needed
        if (placeDetails) {
          console.log('From location coordinates:', placeDetails.geometry.location);
        }
      } else if (activeInput === 'to') {
        setToLocation(suggestion.description);
        // Store coordinates for to location if needed
        if (placeDetails) {
          console.log('To location coordinates:', placeDetails.geometry.location);
        }
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      // Fallback to just setting the text
    if (activeInput === 'from') {
      setFromLocation(suggestion.description);
    } else if (activeInput === 'to') {
      setToLocation(suggestion.description);
    }
    }
    
    setSearchSuggestions([]);
    setActiveInput(null);
  };

  const handleSubmit = () => {
    if (!fromLocation.trim() || !toLocation.trim()) {
      Alert.alert('Error', 'Please enter both pickup and destination locations');
      return;
    }

    onSubmit(fromLocation, toLocation);
    onClose();
  };

  const handleSwapLocations = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
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
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Enter your route
          </Text>
          <IconButton
            icon="close"
            size={24}
            onPress={onClose}
            iconColor={theme.colors.onSurface}
            style={styles.closeButton}
          />
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          {/* From Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <View style={[styles.locationDot, { backgroundColor: '#4CAF50' }]} />
              <TextInput
                value={fromLocation}
                onChangeText={(text) => {
                  setFromLocation(text);
                  handleSearch(text, 'from');
                }}
                placeholder="From"
                style={[styles.input, { backgroundColor: theme.colors.surfaceVariant }]}
                contentStyle={[styles.inputContent, { color: theme.colors.onSurface }]}
                mode="flat"
                dense
                theme={theme}
              />
            </View>
          </View>

          {/* Swap Button */}
          <TouchableOpacity 
            style={styles.swapButton}
            onPress={handleSwapLocations}
          >
            <Ionicons name="swap-vertical" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          {/* To Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <View style={[styles.searchIcon, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="search" size={16} color="white" />
              </View>
              <TextInput
                value={toLocation}
                onChangeText={(text) => {
                  setToLocation(text);
                  handleSearch(text, 'to');
                }}
                placeholder="To"
                style={[styles.input, { backgroundColor: theme.colors.surfaceVariant }]}
                contentStyle={[styles.inputContent, { color: theme.colors.onSurface }]}
                mode="flat"
                dense
                theme={theme}
              />
            </View>
          </View>
        </View>

        {/* Choose on map option */}
        <TouchableOpacity 
          style={styles.mapOption}
          onPress={() => {
            if (onChooseOnMap) {
              onChooseOnMap();
              onClose();
            }
          }}
        >
          <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.mapOptionText, { color: theme.colors.primary }]}>
            Choose on map
          </Text>
        </TouchableOpacity>

        {/* Search Suggestions */}
        {(searchSuggestions.length > 0 || isSearching) && (
          <ScrollView style={styles.suggestionsContainer} showsVerticalScrollIndicator={false}>
            {isSearching && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
                  Searching...
                </Text>
              </View>
            )}
            
            {searchSuggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.place_id}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionSelect(suggestion)}
              >
                <Ionicons name="time-outline" size={20} color={theme.colors.onSurfaceVariant} />
                <View style={styles.suggestionText}>
                  <Text style={[styles.suggestionTitle, { color: theme.colors.onSurface }]}>
                    {suggestion.structured_formatting.main_text}
                  </Text>
                  {suggestion.structured_formatting.secondary_text && (
                    <Text style={[styles.suggestionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                      {suggestion.structured_formatting.secondary_text}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Submit Button */}
        {fromLocation.trim() && toLocation.trim() && (
          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSubmit}
            >
              <Text style={[styles.submitButtonText, { color: theme.colors.onPrimary }]}>
                Set Route
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontWeight: '600',
  },
  closeButton: {
    margin: 0,
  },
  inputSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  searchIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  inputContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  swapButton: {
    alignSelf: 'center',
    padding: 8,
    marginVertical: 4,
  },
  mapOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  mapOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  suggestionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  submitContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RouteEntryModal;
