import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, Title, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const RequestStatusScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = useAuth();
  
  const [requestStatus, setRequestStatus] = useState('pending');
  const [driversInterested, setDriversInterested] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(15);

  const params = route.params as { requestId: string };

  useEffect(() => {
    // Simulate polling for request status
    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
      setDriversInterested(prev => prev + Math.floor(Math.random() * 2));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleCancelRequest = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this ride request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Request Cancelled', 'Your ride request has been cancelled.');
            navigation.navigate('RiderHome' as never);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Ride Request</Text>
          <Text style={styles.headerSubtitle}>
            {requestStatus === 'pending' ? 'Waiting for drivers...' : 'Request processed'}
          </Text>
        </View>
      </View>

      {/* Status Card */}
      <Card style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.statusContent}>
            <Ionicons name="car-sport" size={48} color={theme.colors.primary} />
            <Title style={[styles.statusTitle, { color: theme.colors.onSurface }]}>
              Request Sent!
            </Title>
            <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>
              Your ride request has been sent to nearby drivers
            </Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                  {driversInterested}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Drivers Interested
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                  {timeRemaining}m
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Time Remaining
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Cancel Button */}
      <View style={[styles.cancelContainer, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode="outlined"
          onPress={handleCancelRequest}
          style={[styles.cancelButton, { borderColor: theme.colors.error }]}
          textColor={theme.colors.error}
        >
          Cancel Request
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statusCard: {
    margin: 20,
    borderRadius: 16,
    elevation: 4,
  },
  statusContent: {
    alignItems: 'center',
    padding: 20,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  cancelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    borderRadius: 12,
  },
});

export default RequestStatusScreen;
