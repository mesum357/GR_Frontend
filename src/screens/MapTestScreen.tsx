import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Surface, Button, Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../context/ThemeContext';
import { GOOGLE_MAPS_CONFIG } from '../config/api';

// Only import MapView on mobile platforms
let MapView: any = null;
let PROVIDER_GOOGLE: any = null;
let PROVIDER_DEFAULT: any = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  PROVIDER_DEFAULT = Maps.PROVIDER_DEFAULT;
}

const MapTestScreen: React.FC = () => {
  const { theme } = useTheme();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [mapError, setMapError] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [provider, setProvider] = useState<string>(PROVIDER_GOOGLE || 'google');
  const [loading, setLoading] = useState<boolean>(false);

  // Web fallback
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Surface style={[styles.header, { backgroundColor: theme.colors.primary }]} elevation={4}>
          <Title style={[styles.headerTitle, { color: 'white' }]}>
            🧪 Map Test Center
          </Title>
          <Paragraph style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.9)' }]}>
            Map testing is not available on web platform
          </Paragraph>
        </Surface>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Web Platform Notice
            </Title>
            <Paragraph style={[styles.mapInfo, { color: theme.colors.onSurfaceVariant }]}>
              Map testing is only available on mobile platforms (iOS and Android). 
              Please use the mobile app to test map functionality.
            </Paragraph>
          </Card.Content>
        </Card>
      </View>
    );
  }

  const testRegion: Region = {
    latitude: 35.9213,
    longitude: 74.3082,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const addTestResult = (result: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${result}`]);
    console.log(`🧪 Map Test: ${result}`);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testBasicInfo = () => {
    setCurrentTest('Basic Info Test');
    addTestResult('=== BASIC INFO TEST ===');
    addTestResult(`Platform: ${Platform.OS}`);
    addTestResult(`Platform Version: ${Platform.Version}`);
    addTestResult(`API Key: ${GOOGLE_MAPS_CONFIG.API_KEY}`);
    addTestResult(`API Key Length: ${GOOGLE_MAPS_CONFIG.API_KEY.length}`);
    addTestResult(`Current Provider: ${provider}`);
    addTestResult(`Test Region: ${JSON.stringify(testRegion)}`);
    setCurrentTest('');
  };

  const testMapProvider = (testProvider: string) => {
    setCurrentTest(`Testing ${testProvider}`);
    setProvider(testProvider);
    setMapError(false);
    setMapReady(false);
    setLoading(true);
    
    addTestResult(`=== TESTING ${testProvider.toUpperCase()} ===`);
    addTestResult(`Switching to provider: ${testProvider}`);
    
    // Set timeout for this test
    setTimeout(() => {
      if (!mapReady && !mapError) {
        addTestResult(`❌ ${testProvider} - TIMEOUT (15 seconds)`);
        setMapError(true);
        setLoading(false);
        setCurrentTest('');
      }
    }, 15000);
    
  };

  const testGoogleMaps = () => {
    testMapProvider(PROVIDER_GOOGLE);
  };

  const testDefaultProvider = () => {
    testMapProvider(PROVIDER_DEFAULT);
  };

  const testLocationPermissions = async () => {
    setCurrentTest('Location Permissions Test');
    addTestResult('=== LOCATION PERMISSIONS TEST ===');
    
    try {
      // Check current permission status
      const { status } = await Location.getForegroundPermissionsAsync();
      addTestResult(`Current permission status: ${status}`);
      
      if (status !== 'granted') {
        addTestResult('Requesting location permission...');
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        addTestResult(`New permission status: ${newStatus}`);
      }
      
      // Try to get current location
      addTestResult('Attempting to get current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });
      addTestResult(`✅ Location obtained: ${location.coords.latitude}, ${location.coords.longitude}`);
      
    } catch (error: any) {
      addTestResult(`❌ Location error: ${error.message}`);
      addTestResult(`❌ Error details: ${JSON.stringify(error, null, 2)}`);
    }
    
    setCurrentTest('');
  };

  const testMapViewProps = () => {
    setCurrentTest('MapView Props Test');
    addTestResult('=== MAPVIEW PROPS TEST ===');
    
    const props = {
      provider: provider,
      mapType: 'terrain',
      showsUserLocation: true,
      showsMyLocationButton: false,
      loadingEnabled: false,
      pitchEnabled: true,
      rotateEnabled: true,
      showsBuildings: true,
    };
    
    addTestResult(`MapView props: ${JSON.stringify(props, null, 2)}`);
    setCurrentTest('');
  };

  const handleMapReady = () => {
    addTestResult(`✅ Map ready with provider: ${provider}`);
    setMapReady(true);
    setLoading(false);
    setMapError(false);
    setCurrentTest('');
  };

  // Effect to handle loading state when map is ready
  useEffect(() => {
    if (mapReady && loading) {
      setLoading(false);
      setCurrentTest('');
    }
  }, [mapReady, loading]);

  const handleMapError = (error: any) => {
    addTestResult(`❌ Map error with ${provider}: ${JSON.stringify(error, null, 2)}`);
    setMapError(true);
    setLoading(false);
    setCurrentTest('');
  };

  const runAllTests = () => {
    clearResults();
    addTestResult('🚀 RUNNING ALL TESTS...');
    
    setTimeout(() => testBasicInfo(), 500);
    setTimeout(() => testLocationPermissions(), 1000);
    setTimeout(() => testMapViewProps(), 1500);
    // Don't run map provider tests automatically to avoid loading state issues
    addTestResult('ℹ️ Map provider tests available via individual buttons');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <Surface style={[styles.header, { backgroundColor: theme.colors.primary }]} elevation={4}>
          <Title style={[styles.headerTitle, { color: 'white' }]}>
            🧪 Map Test Center
          </Title>
          <Paragraph style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.9)' }]}>
            Debug Android map loading issues
          </Paragraph>
        </Surface>

        {/* Test Controls */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Test Controls
            </Title>
            
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={runAllTests}
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                disabled={currentTest !== ''}
              >
                Run All Tests
              </Button>
              <Button
                mode="outlined"
                onPress={clearResults}
                style={styles.button}
              >
                Clear Results
              </Button>
            </View>

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={testBasicInfo}
                style={styles.button}
                disabled={currentTest !== ''}
              >
                Basic Info
              </Button>
              <Button
                mode="outlined"
                onPress={testLocationPermissions}
                style={styles.button}
                disabled={currentTest !== ''}
              >
                Location Test
              </Button>
            </View>

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={testGoogleMaps}
                style={[styles.button, { borderColor: provider === PROVIDER_GOOGLE ? theme.colors.primary : undefined }]}
                disabled={currentTest !== ''}
              >
                Test Google Maps
              </Button>
              <Button
                mode="outlined"
                onPress={testDefaultProvider}
                style={[styles.button, { borderColor: provider === PROVIDER_DEFAULT ? theme.colors.primary : undefined }]}
                disabled={currentTest !== ''}
              >
                Test Default
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Current Test Status */}
        {currentTest && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <Card.Content>
              <View style={styles.statusContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.statusText, { color: theme.colors.onSurface }]}>
                  {currentTest}...
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Map Test Area */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Map Test Area
            </Title>
            <Text style={[styles.mapInfo, { color: theme.colors.onSurfaceVariant }]}>
              Provider: {provider === PROVIDER_GOOGLE ? 'Google Maps' : 'Default'}
            </Text>
            <Text style={[styles.mapInfo, { color: theme.colors.onSurfaceVariant }]}>
              Status: {mapReady ? '✅ Ready' : mapError ? '❌ Error' : loading ? '⏳ Loading' : '⏸️ Idle'}
            </Text>
            
            <View style={styles.mapContainer}>
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
                    Loading map...
                  </Text>
                </View>
              )}

              {mapError && (
                <View style={styles.errorOverlay}>
                  <Ionicons name="warning" size={48} color="#d32f2f" />
                  <Text style={[styles.errorText, { color: '#d32f2f' }]}>
                    Map failed to load
                  </Text>
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
          </Card.Content>
        </Card>

        {/* Test Results */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <View style={styles.resultsHeader}>
              <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                Test Results
              </Title>
              <TouchableOpacity onPress={clearResults}>
                <Ionicons name="trash-outline" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.resultsContainer} nestedScrollEnabled>
              {testResults.length === 0 ? (
                <Text style={[styles.noResults, { color: theme.colors.onSurfaceVariant }]}>
                  No test results yet. Run some tests to see results here.
                </Text>
              ) : (
                testResults.map((result, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.resultText,
                      { color: theme.colors.onSurface },
                      result.includes('❌') && { color: '#d32f2f' },
                      result.includes('✅') && { color: '#2e7d32' },
                    ]}
                  >
                    {result}
                  </Text>
                ))
              )}
            </ScrollView>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  mapInfo: {
    fontSize: 14,
    marginBottom: 8,
  },
  mapContainer: {
    height: 300,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
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
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
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
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsContainer: {
    maxHeight: 300,
  },
  noResults: {
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 16,
  },
});

export default MapTestScreen;
