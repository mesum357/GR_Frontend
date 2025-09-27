import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { Card, Title, Button, Avatar, ActivityIndicator, Paragraph, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { authenticatedApiRequestData } from '../config/api';

const DriverProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const { token, user } = useAuth();
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rideRequests, setRideRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDriverData();
  }, []);

  const fetchDriverData = async () => {
    if (!token) return;

    try {
      // First get driver profile
      const profileData = await authenticatedApiRequestData('/api/drivers/profile');
      setDriverProfile(profileData.driver);

      // Only fetch ride requests if driver is online
      if (profileData.driver?.isOnline) {
        try {
          const requestsData = await authenticatedApiRequestData('/api/drivers/available-requests');
          setRideRequests(requestsData.requests || []);
        } catch (requestError) {
          console.log('Could not fetch ride requests:', requestError.message);
          setRideRequests([]);
        }
      } else {
        setRideRequests([]);
      }
    } catch (error) {
      console.error('Error fetching driver data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDriverData();
  };

  const toggleOnlineStatus = async () => {
    try {
      const data = await authenticatedApiRequestData('/api/drivers/toggle-status', {
        method: 'POST',
      });

      setDriverProfile(prev => ({
        ...prev,
        isOnline: data.isOnline,
        isAvailable: data.isAvailable
      }));

      // If going online, fetch ride requests
      if (data.isOnline) {
        try {
          const requestsData = await authenticatedApiRequestData('/api/drivers/available-requests');
          setRideRequests(requestsData.requests || []);
        } catch (requestError) {
          console.log('Could not fetch ride requests:', requestError.message);
          setRideRequests([]);
        }
      } else {
        setRideRequests([]);
      }

      Alert.alert('Status Updated', `You are now ${data.isOnline ? 'online' : 'offline'}`);
    } catch (error) {
      console.error('Error toggling status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground, marginTop: 16 }]}>
          Loading driver profile...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* Profile Header */}
      <Card style={[styles.profileCard, { backgroundColor: theme.colors.primary }]}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text 
            size={80} 
            label={`${user?.firstName?.charAt(0)}${user?.lastName?.charAt(0)}`}
            style={styles.avatar}
          />
          <Title style={styles.profileName}>
            {user?.firstName} {user?.lastName}
          </Title>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <Text style={styles.profilePhone}>{user?.phone}</Text>
        </Card.Content>
      </Card>

      {/* Vehicle Information */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            Vehicle Information
          </Title>
          
          <View style={styles.infoRow}>
            <Ionicons name="car" size={20} color={theme.colors.primary} />
            <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
              {driverProfile?.vehicleInfo?.year} {driverProfile?.vehicleInfo?.make} {driverProfile?.vehicleInfo?.model}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="color-palette" size={20} color={theme.colors.primary} />
            <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
              {driverProfile?.vehicleInfo?.color}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="card" size={20} color={theme.colors.primary} />
            <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
              {driverProfile?.vehicleInfo?.plateNumber}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Statistics */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            Statistics
          </Title>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {driverProfile?.totalRides || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Total Rides
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {driverProfile?.rating ? driverProfile.rating.toFixed(1) : 'N/A'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Rating
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                ${driverProfile?.totalEarnings || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Earnings
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Ride Requests Section */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Available Ride Requests
            </Title>
            <Chip 
              icon="refresh" 
              onPress={onRefresh}
              style={{ backgroundColor: theme.colors.primaryContainer }}
            >
              Refresh
            </Chip>
          </View>
          
          {!driverProfile?.isOnline ? (
            <View style={styles.emptyState}>
              <Ionicons name="power" size={48} color={theme.colors.onSurfaceVariant} />
              <Paragraph style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
                Go online to see available ride requests
              </Paragraph>
            </View>
          ) : rideRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color={theme.colors.onSurfaceVariant} />
              <Paragraph style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
                No ride requests available at the moment
              </Paragraph>
            </View>
          ) : (
            rideRequests.map((request: any, index: number) => (
              <Card key={index} style={[styles.requestCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Card.Content>
                  <View style={styles.requestHeader}>
                    <Text style={[styles.requestPrice, { color: theme.colors.primary }]}>
                      Rs. {request.price}
                    </Text>
                    <Chip 
                      style={{ backgroundColor: theme.colors.primary + '20' }}
                      textStyle={{ color: theme.colors.primary }}
                    >
                      {request.distance}km
                    </Chip>
                  </View>
                  
                  <View style={styles.routeInfo}>
                    <View style={styles.routePoint}>
                      <Ionicons name="radio-button-on" size={12} color={theme.colors.primary} />
                      <Text style={[styles.routeText, { color: theme.colors.onSurfaceVariant }]}>
                        {request.pickup.address}
                      </Text>
                    </View>
                    <View style={styles.routePoint}>
                      <Ionicons name="location" size={12} color={theme.colors.error} />
                      <Text style={[styles.routeText, { color: theme.colors.onSurfaceVariant }]}>
                        {request.destination.address}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.requestActions}>
                    <Button 
                      mode="outlined" 
                      style={styles.requestActionButton}
                      onPress={() => Alert.alert('Coming Soon', 'Counter offer feature will be available soon')}
                    >
                      Counter Offer
                    </Button>
                    <Button 
                      mode="contained" 
                      style={styles.requestActionButton}
                      onPress={() => Alert.alert('Coming Soon', 'Accept request feature will be available soon')}
                    >
                      Accept
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        <Button
          mode="contained"
          onPress={toggleOnlineStatus}
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          icon={driverProfile?.isOnline ? 'power' : 'power'}
        >
          {driverProfile?.isOnline ? 'Go Offline' : 'Go Online'}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  profileCard: {
    margin: 16,
    borderRadius: 16,
  },
  profileContent: {
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  profileName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 2,
  },
  profilePhone: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  card: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoValue: {
    fontSize: 14,
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  actionContainer: {
    padding: 16,
  },
  actionButton: {
    borderRadius: 8,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  requestCard: {
    marginBottom: 12,
    borderRadius: 8,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  routeInfo: {
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeText: {
    marginLeft: 8,
    fontSize: 14,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requestActionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default DriverProfileScreen;
