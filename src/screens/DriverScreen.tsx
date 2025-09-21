import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Button, Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DriverStackParamList } from '../navigation/DriverNavigator';
import { useAuth } from '../context/AuthContext';
import { authenticatedApiRequest, API_ENDPOINTS } from '../config/api';
import DriverDashboardScreen from './driver/DriverDashboardScreen';

const DriverScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<StackNavigationProp<DriverStackParamList>>();
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [isRegisteredDriver, setIsRegisteredDriver] = useState(false);
  const [driverProfile, setDriverProfile] = useState(null);

  useEffect(() => {
    checkDriverRegistration();
  }, [user]); // Re-check when user changes

  const checkDriverRegistration = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    // First check if user type is driver
    if (user?.userType === 'driver') {
      console.log('🚗 User is already registered as driver based on userType');
      setIsRegisteredDriver(true);
      setIsLoading(false);
      
      // Still try to get driver profile for additional data
      try {
        const data = await authenticatedApiRequest('/api/drivers/check-registration');
        if (data.driverProfile) {
          setDriverProfile(data.driverProfile);
        }
      } catch (error) {
        console.log('Could not fetch additional driver profile data:', error);
      }
      return;
    }

    // If user type is not driver, check via API
    try {
      console.log('🚗 Checking driver registration via API...');
      const data = await authenticatedApiRequest('/api/drivers/check-registration');
      
      console.log('🚗 Driver registration response:', data);
      setIsRegisteredDriver(data.isRegistered || false);
      if (data.isRegistered && data.driverProfile) {
        setDriverProfile(data.driverProfile);
      }
    } catch (error) {
      console.error('Network error checking driver registration:', error);
      setIsRegisteredDriver(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterAsDriver = () => {
    navigation.navigate('DriverRegistration');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground, marginTop: 16 }]}>
          Checking driver status...
        </Text>
      </View>
    );
  }

  if (isRegisteredDriver) {
    return <DriverDashboardScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Ionicons name="car" size={48} color="white" />
        <Text style={styles.headerTitle}>Become a Driver</Text>
        <Text style={styles.headerSubtitle}>
          Start earning by driving with us
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Why Drive With Us?
            </Title>
            
            <View style={styles.benefitItem}>
              <Ionicons name="cash" size={24} color={theme.colors.primary} />
              <View style={styles.benefitText}>
                <Text style={[styles.benefitTitle, { color: theme.colors.onSurface }]}>
                  Earn More
                </Text>
                <Text style={[styles.benefitDescription, { color: theme.colors.onSurfaceVariant }]}>
                  Keep up to 85% of your earnings
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="time" size={24} color={theme.colors.primary} />
              <View style={styles.benefitText}>
                <Text style={[styles.benefitTitle, { color: theme.colors.onSurface }]}>
                  Flexible Hours
                </Text>
                <Text style={[styles.benefitDescription, { color: theme.colors.onSurfaceVariant }]}>
                  Work when you want, where you want
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
              <View style={styles.benefitText}>
                <Text style={[styles.benefitTitle, { color: theme.colors.onSurface }]}>
                  Safe & Secure
                </Text>
                <Text style={[styles.benefitDescription, { color: theme.colors.onSurfaceVariant }]}>
                  Verified riders and secure payments
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Requirements
            </Title>
            
            <View style={styles.requirementItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              <Text style={[styles.requirementText, { color: theme.colors.onSurface }]}>
                Valid driver's license
              </Text>
            </View>

            <View style={styles.requirementItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              <Text style={[styles.requirementText, { color: theme.colors.onSurface }]}>
                Vehicle insurance
              </Text>
            </View>

            <View style={styles.requirementItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              <Text style={[styles.requirementText, { color: theme.colors.onSurface }]}>
                Clean driving record
              </Text>
            </View>

            <View style={styles.requirementItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              <Text style={[styles.requirementText, { color: theme.colors.onSurface }]}>
                Vehicle in good condition
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleRegisterAsDriver}
          style={[styles.registerButton, { backgroundColor: theme.colors.primary }]}
          contentStyle={styles.registerButtonContent}
          labelStyle={[styles.registerButtonLabel, { color: '#FFFFFF' }]}
          textColor="#FFFFFF"
          icon="car"
        >
          Register as Driver
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  benefitText: {
    marginLeft: 16,
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requirementText: {
    fontSize: 16,
    marginLeft: 12,
  },
  registerButton: {
    marginTop: 20,
    borderRadius: 12,
    elevation: 2,
  },
  registerButtonContent: {
    paddingVertical: 8,
  },
  registerButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DriverScreen;
