import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export interface TransportMode {
  id: string;
  name: string;
  icon: string;
  capacity: number;
  features?: string[];
  basePrice: number;
  color: string;
}

interface TransportModeSelectorProps {
  onModeSelect: (mode: TransportMode) => void;
  selectedMode?: TransportMode;
}

const TRANSPORT_MODES: TransportMode[] = [
  {
    id: 'ride_mini',
    name: 'Ride Mini',
    icon: 'car-outline',
    capacity: 4,
    basePrice: 100,
    color: '#2196F3',
  },
  {
    id: 'moto',
    name: 'Moto',
    icon: 'bicycle-outline',
    capacity: 1,
    basePrice: 50,
    color: '#4CAF50',
  },
  {
    id: 'ride_ac',
    name: 'Ride A/C',
    icon: 'car',
    capacity: 4,
    features: ['AC'],
    basePrice: 150,
    color: '#2196F3',
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: 'car-sport',
    capacity: 4,
    features: ['Premium'],
    basePrice: 200,
    color: '#9C27B0',
  },
];

const TransportModeSelector: React.FC<TransportModeSelectorProps> = ({
  onModeSelect,
  selectedMode,
}) => {
  const { theme } = useTheme();
  const [selectedModeId, setSelectedModeId] = useState<string>(
    selectedMode?.id || TRANSPORT_MODES[0].id
  );

  const handleModeSelect = (mode: TransportMode) => {
    setSelectedModeId(mode.id);
    onModeSelect(mode);
  };

  const renderModeItem = (mode: TransportMode) => {
    const isSelected = selectedModeId === mode.id;
    
    return (
      <TouchableOpacity
        key={mode.id}
        onPress={() => handleModeSelect(mode)}
        style={styles.modeItemContainer}
        activeOpacity={0.7}
      >
        <Surface
          style={[
            styles.modeItem,
            {
              backgroundColor: isSelected ? mode.color : theme.colors.surface,
              borderColor: isSelected ? mode.color : theme.colors.outline,
            },
          ]}
          elevation={isSelected ? 4 : 1}
        >
          <View style={styles.modeContent}>
            {/* Icon Container */}
            <View style={[
              styles.iconContainer,
              { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : theme.colors.surfaceVariant }
            ]}>
              <Ionicons
                name={mode.icon as any}
                size={20}
                color={isSelected ? 'white' : theme.colors.onSurface}
              />
              {/* AC or Premium indicator */}
              {mode.features?.includes('AC') && (
                <View style={styles.featureIcon}>
                  <Ionicons name="snow-outline" size={12} color="white" />
                </View>
              )}
              {mode.features?.includes('Premium') && (
                <View style={styles.featureIcon}>
                  <Ionicons name="star" size={12} color="white" />
                </View>
              )}
            </View>

            {/* Mode Info */}
            <View style={styles.modeInfo}>
              <Text
                variant="labelMedium"
                style={[
                  styles.modeName,
                  { color: isSelected ? 'white' : theme.colors.onSurface }
                ]}
              >
                {mode.name}
              </Text>
              <View style={styles.capacityRow}>
                <Ionicons
                  name="person"
                  size={12}
                  color={isSelected ? 'white' : theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="labelSmall"
                  style={[
                    styles.capacityText,
                    { color: isSelected ? 'white' : theme.colors.onSurfaceVariant }
                  ]}
                >
                  {mode.capacity}
                </Text>
              </View>
            </View>
          </View>
        </Surface>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {TRANSPORT_MODES.map(renderModeItem)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingBottom: 20,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  modeItemContainer: {
    marginRight: 16,
  },
  modeItem: {
    borderRadius: 8,
    borderWidth: 1.5,
    width: 90,
    height: 60,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  modeContent: {
    alignItems: 'center',
    gap: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  featureIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeInfo: {
    alignItems: 'center',
    gap: 1,
    flex: 1,
  },
  modeName: {
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 12,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  capacityText: {
    fontSize: 10,
  },
});

export default TransportModeSelector;
export { TRANSPORT_MODES };
