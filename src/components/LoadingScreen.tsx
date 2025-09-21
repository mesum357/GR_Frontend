import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const LoadingScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="car-sport" size={48} color="white" />
        </View>
        <Text style={[styles.appTitle, { color: theme.colors.onBackground }]}>
          Tourist Ride
        </Text>
        <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
          Loading...
        </Text>
        <ActivityIndicator 
          size="large" 
          color={theme.colors.primary} 
          style={styles.spinner}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 16,
    marginBottom: 24,
  },
  spinner: {
    marginTop: 16,
  },
});

export default LoadingScreen;
