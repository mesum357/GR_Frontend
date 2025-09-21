import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Surface, Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface MapFallbackProps {
  onRetry?: () => void;
  message?: string;
}

export const MapFallback: React.FC<MapFallbackProps> = ({ 
  onRetry, 
  message = "Map is currently unavailable" 
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Surface style={[styles.content, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Ionicons 
          name="map-outline" 
          size={64} 
          color={theme.colors.onSurfaceVariant} 
          style={styles.icon}
        />
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
          {message}
        </Text>
        <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          The map component is having trouble loading. This might be due to:
        </Text>
        <View style={styles.reasonsList}>
          <Text variant="bodySmall" style={[styles.reason, { color: theme.colors.onSurfaceVariant }]}>
            • Google Maps configuration
          </Text>
          <Text variant="bodySmall" style={[styles.reason, { color: theme.colors.onSurfaceVariant }]}>
            • Network connectivity
          </Text>
          <Text variant="bodySmall" style={[styles.reason, { color: theme.colors.onSurfaceVariant }]}>
            • Location permissions
          </Text>
        </View>
        {onRetry && (
          <Button 
            mode="contained" 
            onPress={onRetry}
            style={styles.retryButton}
            icon="refresh"
          >
            Try Again
          </Button>
        )}
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: width * 0.8,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  reasonsList: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  reason: {
    marginBottom: 4,
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 8,
  },
});
