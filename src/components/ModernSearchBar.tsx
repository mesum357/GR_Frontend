import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  FlatList,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

// Comprehensive Gilgit-Baltistan dataset
const GILGIT_BALTISTAN_PLACES = [
  // Cities and Towns
  'Gilgit',
  'Skardu',
  'Hunza',
  'Nagar',
  'Astore',
  'Diamer',
  'Ghizer',
  'Gupis',
  'Ishkoman',
  'Jaglot',
  'Khaplu',
  'Minimarg',
  'Passu',
  'Rakaposhi',
  'Shigar',
  'Tashkurgan',
  'Yasin',
  'Chitral',
  
  // Landmarks and Tourist Spots
  'Baltit Fort',
  'Altit Fort',
  'Hunza Valley',
  'Nagar Valley',
  'Shimshal Valley',
  'Karakoram Highway',
  'K2 Base Camp',
  'Concordia',
  'Fairy Meadows',
  'Nanga Parbat Base Camp',
  'Deosai National Park',
  'Shandur Pass',
  'Khunjerab Pass',
  'Attabad Lake',
  'Rush Lake',
  'Rakaposhi Base Camp',
  'Batura Glacier',
  'Hispar Glacier',
  'Baltoro Glacier',
  'Siachen Glacier',
  
  // Airports and Transportation
  'Gilgit Airport',
  'Skardu Airport',
  'Chitral Airport',
  
  // Educational Institutions
  'Gilgit University',
  'Karakoram International University',
  'Gilgit Medical College',
  'Army Public School Gilgit',
  'Aga Khan School Hunza',
  'Government College Skardu',
  'Gilgit Institute of Technology',
  
  // Hospitals and Medical
  'Gilgit Hospital',
  'Skardu Hospital',
  'Aga Khan Health Service Hunza',
  'District Headquarter Hospital',
  'Military Hospital Gilgit',
  'Gilgit Medical Center',
  
  // Markets and Commercial
  'Gilgit Bazaar',
  'Skardu Bazaar',
  'Hunza Bazaar',
  'Karakoram Bazaar',
  'Central Market Gilgit',
  'Jinnah Market',
  'China Market',
  'Tibetan Market',
  
  // Restaurants and Food
  'Mountain View Restaurant',
  'Hunza Food Court',
  'Karakoram Restaurant',
  'Baltit Fort Restaurant',
  'Gilgit Food Street',
  'Skardu Food Center',
  'Hunza Traditional Food',
  'Gilgit Continental',
  
  // Hotels and Accommodation
  'Serena Hotel Gilgit',
  'Hunza Embassy Hotel',
  'Baltit Fort Hotel',
  'Karakoram Lodge',
  'Gilgit Continental Hotel',
  'Skardu Hotel',
  'Hunza Inn',
  'Mountain View Hotel',
  
  // Religious Places
  'Ali a.s Mosque',
  'Central Jamia Mosque Gilgit',
  'Shia Imambargah',
  'Sunni Mosque',
  'Buddhist Monastery',
  'Hindu Temple',
  'Sikh Gurdwara',
  
  // Government and Administrative
  'Gilgit Secretariat',
  'Skardu Secretariat',
  'District Commissioner Office',
  'Police Station Gilgit',
  'Customs Office',
  'Immigration Office',
  'Tourist Information Center',
  
  // Banks and Financial
  'National Bank Gilgit',
  'Habib Bank Skardu',
  'United Bank Hunza',
  'Allied Bank',
  'Bank of Punjab',
  'Askari Bank',
  'MCB Bank',
  
  // Sports and Recreation
  'Gilgit Sports Complex',
  'Polo Ground Gilgit',
  'Skardu Golf Course',
  'Hunza Cricket Ground',
  'Gilgit Football Stadium',
  'Mountaineering Club',
  'Trekking Center',
  
  // Specific Areas and Neighborhoods
  'Shahr-e-Quaid-e-Azam',
  'Jutial',
  'Danyore',
  'Nomal',
  'Aliabad',
  'Karimabad',
  'Eidgah',
  'Rahimabad',
  'Sultanabad',
  'Ganish',
  'Altit',
  'Murtazabad',
  'Shimshal',
  'Chapursan',
  'Gojal',
  'Upper Hunza',
  'Lower Hunza',
  'Central Hunza',
];

interface SearchBarProps {
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  fromValue: string;
  toValue: string;
  placeholder?: {
    from?: string;
    to?: string;
  };
}

const ModernSearchBar: React.FC<SearchBarProps> = ({
  onFromChange,
  onToChange,
  fromValue,
  toValue,
  placeholder = {
    from: 'From',
    to: 'To',
  },
}) => {
  const { theme } = useTheme();
  const [activeInput, setActiveInput] = useState<'from' | 'to' | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const dropdownAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(-10)).current;

  // Filter suggestions based on search query
  const filterSuggestions = (query: string): string[] => {
    if (!query.trim()) return [];
    
    return GILGIT_BALTISTAN_PLACES.filter(place =>
      place.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8); // Limit to 8 suggestions for better UX
  };

  // Handle input focus
  const handleInputFocus = (inputType: 'from' | 'to') => {
    setActiveInput(inputType);
    const currentValue = inputType === 'from' ? fromValue : toValue;
    setSearchQuery(currentValue);
    
    if (currentValue.trim()) {
      const filtered = filterSuggestions(currentValue);
      setSuggestions(filtered);
      showDropdown();
    }
  };

  // Handle input change
  const handleInputChange = (text: string, inputType: 'from' | 'to') => {
    setSearchQuery(text);
    
    if (inputType === 'from') {
      onFromChange(text);
    } else {
      onToChange(text);
    }

    if (text.trim()) {
      const filtered = filterSuggestions(text);
      setSuggestions(filtered);
      showDropdown();
    } else {
      hideDropdown();
    }
  };

  // Show dropdown with animation
  const showDropdown = () => {
    setIsDropdownVisible(true);
    Animated.parallel([
      Animated.timing(dropdownAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Hide dropdown with animation
  const hideDropdown = () => {
    Animated.parallel([
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: -10,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsDropdownVisible(false);
    });
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    if (activeInput === 'from') {
      onFromChange(suggestion);
    } else if (activeInput === 'to') {
      onToChange(suggestion);
    }
    
    setSearchQuery('');
    hideDropdown();
    Keyboard.dismiss();
  };

  // Handle input blur
  const handleInputBlur = () => {
    setTimeout(() => {
      setActiveInput(null);
      hideDropdown();
    }, 150);
  };

  // Swap locations
  const handleSwap = () => {
    const tempFrom = fromValue;
    const tempTo = toValue;
    onFromChange(tempTo);
    onToChange(tempFrom);
  };

  const renderSuggestion = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.suggestionItem,
        { 
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.outline,
        }
      ]}
      onPress={() => handleSuggestionSelect(item)}
      activeOpacity={0.7}
    >
      <Ionicons 
        name="location-outline" 
        size={16} 
        color={theme.colors.primary} 
        style={styles.suggestionIcon}
      />
      <Text 
        style={[
          styles.suggestionText, 
          { color: theme.colors.onSurface }
        ]}
        numberOfLines={1}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* From Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons 
            name="location-outline" 
            size={20} 
            color={activeInput === 'from' ? theme.colors.primary : theme.colors.outline} 
            style={styles.inputIcon}
          />
          <TextInput
            style={[
              styles.textInput,
              {
                color: theme.colors.onSurface,
                borderColor: activeInput === 'from' ? theme.colors.primary : theme.colors.outline,
                backgroundColor: theme.colors.surface,
              }
            ]}
            placeholder={placeholder.from}
            placeholderTextColor={theme.colors.outline}
            value={fromValue}
            onChangeText={(text) => handleInputChange(text, 'from')}
            onFocus={() => handleInputFocus('from')}
            onBlur={handleInputBlur}
            returnKeyType="next"
            autoCorrect={false}
            autoCapitalize="words"
          />
        </View>
      </View>

      {/* Swap Button */}
      <TouchableOpacity
        style={[
          styles.swapButton,
          { backgroundColor: theme.colors.primary }
        ]}
        onPress={handleSwap}
        activeOpacity={0.8}
      >
        <Ionicons name="swap-vertical" size={20} color="white" />
      </TouchableOpacity>

      {/* To Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons 
            name="flag-outline" 
            size={20} 
            color={activeInput === 'to' ? theme.colors.primary : theme.colors.outline} 
            style={styles.inputIcon}
          />
          <TextInput
            style={[
              styles.textInput,
              {
                color: theme.colors.onSurface,
                borderColor: activeInput === 'to' ? theme.colors.primary : theme.colors.outline,
                backgroundColor: theme.colors.surface,
              }
            ]}
            placeholder={placeholder.to}
            placeholderTextColor={theme.colors.outline}
            value={toValue}
            onChangeText={(text) => handleInputChange(text, 'to')}
            onFocus={() => handleInputFocus('to')}
            onBlur={handleInputBlur}
            returnKeyType="done"
            autoCorrect={false}
            autoCapitalize="words"
          />
        </View>
      </View>

      {/* Suggestions Dropdown */}
      {isDropdownVisible && suggestions.length > 0 && (
        <Animated.View
          style={[
            styles.dropdown,
            {
              backgroundColor: theme.colors.surface,
              shadowColor: theme.colors.shadow,
              opacity: fadeAnimation,
              transform: [
                { translateY: slideAnimation },
                { scaleY: dropdownAnimation }
              ],
            }
          ]}
        >
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.suggestionsList}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  textInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    paddingLeft: 48,
    borderRadius: 16,
    borderWidth: 2,
    fontSize: 16,
    fontWeight: '500',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  dropdown: {
    position: 'absolute',
    top: 120, // Position below both inputs
    left: 0,
    right: 0,
    borderRadius: 16,
    maxHeight: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  suggestionsList: {
    borderRadius: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default ModernSearchBar;


