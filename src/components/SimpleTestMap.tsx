import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

export const SimpleTestMap: React.FC = () => {
  const testRegion = {
    latitude: 35.9213,
    longitude: 74.3082,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <Text variant="headlineSmall">Simple Map Test</Text>
        <Text variant="bodyMedium">Testing basic map functionality without Google Maps API</Text>
      </Surface>
      
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={testRegion}
        onMapReady={() => console.log('🗺️ Simple test map ready')}
        onError={(error) => console.error('🗺️ Simple test map error:', error)}
        loadingEnabled={false}
        mapType="standard"
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
      
      <Surface style={styles.footer} elevation={2}>
        <Text variant="bodySmall">
          Provider: Google Maps
        </Text>
        <Text variant="bodySmall">
          If this map loads, the issue is with Google Maps configuration.
        </Text>
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
    margin: 8,
    borderRadius: 8,
  },
  map: {
    flex: 1,
    margin: 8,
    borderRadius: 8,
  },
  footer: {
    padding: 16,
    margin: 8,
    borderRadius: 8,
  },
});
