import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import { Text, Button, Surface, ActivityIndicator } from 'react-native-paper';
import MapView, { PROVIDER_GOOGLE, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { GOOGLE_MAPS_CONFIG } from '../config/api';

const AndroidMapTest: React.FC = () => {
  const [mapError, setMapError] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [provider, setProvider] = useState<string>(PROVIDER_GOOGLE);
  const [loading, setLoading] = useState<boolean>(true);

  const testRegion: Region = {
    latitude: 35.9213,
    longitude: 74.3082,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  useEffect(() => {
    console.log('🧪 Android Map Test - Platform:', Platform.OS);
    console.log('🧪 Android Map Test - Provider:', provider);
    console.log('🧪 Android Map Test - API Key:', GOOGLE_MAPS_CONFIG.API_KEY);
    
    // Set a timeout to detect if map never loads
    const timeout = setTimeout(() => {
      if (!mapReady && !mapError) {
        console.warn('🧪 Android Map Test - Timeout reached, map not ready');
        setMapError(true);
        setLoading(false);
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [provider, mapReady, mapError]);

  const handleMapReady = () => {
    console.log('🧪 Android Map Test - Map ready!');
    setMapReady(true);
    setLoading(false);
    setMapError(false);
  };

  const handleMapError = (error: any) => {
    console.error('🧪 Android Map Test - Map error:', error);
    console.error('🧪 Android Map Test - Error details:', JSON.stringify(error, null, 2));
    setMapError(true);
    setLoading(false);
  };

  const switchProvider = () => {
    const newProvider = provider === PROVIDER_GOOGLE ? PROVIDER_DEFAULT : PROVIDER_GOOGLE;
    console.log('🧪 Android Map Test - Switching to provider:', newProvider);
    setProvider(newProvider);
    setMapReady(false);
    setMapError(false);
    setLoading(true);
  };

  const retryMap = () => {
    console.log('🧪 Android Map Test - Retrying map...');
    setMapReady(false);
    setMapError(false);
    setLoading(true);
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <Text variant="headlineSmall">Android Map Test</Text>
        <Text variant="bodyMedium">Platform: {Platform.OS}</Text>
        <Text variant="bodyMedium">Provider: {provider === PROVIDER_GOOGLE ? 'Google Maps' : 'Default'}</Text>
        <Text variant="bodySmall">API Key: {GOOGLE_MAPS_CONFIG.API_KEY.substring(0, 20)}...</Text>
      </Surface>

      <View style={styles.mapContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FF5722" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}

        {mapError && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>Map failed to load</Text>
            <Button mode="contained" onPress={retryMap} style={styles.retryButton}>
              Retry
            </Button>
            <Button mode="outlined" onPress={switchProvider} style={styles.switchButton}>
              Switch Provider
            </Button>
          </View>
        )}

        <MapView
          provider={provider}
          style={styles.map}
          region={testRegion}
          onMapReady={handleMapReady}
          onError={handleMapError}
          mapType="standard"
          showsUserLocation={true}
          showsMyLocationButton={false}
          loadingEnabled={false}
          pitchEnabled={true}
          rotateEnabled={true}
          showsBuildings={true}
          showsPointsOfInterest={true}
          camera={{
            center: {
              latitude: 35.9213,
              longitude: 74.3082,
            },
            pitch: 0,
            heading: 0,
            altitude: 2000,
            zoom: 15,
          }}
        />
      </View>

      <Surface style={styles.footer} elevation={2}>
        <Text variant="bodySmall">
          Status: {mapReady ? '✅ Ready' : mapError ? '❌ Error' : '⏳ Loading'}
        </Text>
        <Button mode="outlined" onPress={switchProvider} style={styles.button}>
          Switch to {provider === PROVIDER_GOOGLE ? 'Default' : 'Google Maps'}
        </Button>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    marginBottom: 10,
  },
  switchButton: {
    marginBottom: 10,
  },
  footer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  button: {
    marginTop: 10,
  },
});

export default AndroidMapTest;
