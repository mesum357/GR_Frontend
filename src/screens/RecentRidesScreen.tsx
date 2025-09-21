import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Chip, Divider } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';

const RecentRidesScreen: React.FC = () => {
  const { theme } = useTheme();

  // Mock recent rides data
  const recentRides = [
    {
      id: '1',
      date: '2024-08-29',
      time: '2:30 PM',
      from: 'Gilgit City Center',
      to: 'Hunza Valley',
      driver: 'Ali Khan',
      price: 'Rs. 2,500',
      status: 'completed',
      rating: 4.5,
    },
    {
      id: '2',
      date: '2024-08-28',
      time: '10:15 AM',
      from: 'Airport Road',
      to: 'Skardu',
      driver: 'Hassan Ahmed',
      price: 'Rs. 3,200',
      status: 'completed',
      rating: 5.0,
    },
    {
      id: '3',
      date: '2024-08-27',
      time: '6:45 PM',
      from: 'Jutial',
      to: 'Gilgit Bazaar',
      driver: 'Muhammad Shah',
      price: 'Rs. 800',
      status: 'cancelled',
      rating: null,
    },
    {
      id: '4',
      date: '2024-08-26',
      time: '11:30 AM',
      from: 'Gilgit University',
      to: 'Danyor',
      driver: 'Karim Ullah',
      price: 'Rs. 600',
      status: 'completed',
      rating: 4.8,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.primary;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.outline;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Title style={[styles.title, { color: theme.colors.onBackground }]}>
          My Recent Rides
        </Title>
        
        {recentRides.map((ride, index) => (
          <Card key={ride.id} style={[styles.rideCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.rideHeader}>
                <View style={styles.dateTime}>
                  <Paragraph style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
                    {ride.date}
                  </Paragraph>
                  <Paragraph style={[styles.time, { color: theme.colors.onSurfaceVariant }]}>
                    {ride.time}
                  </Paragraph>
                </View>
                <Chip 
                  style={{ backgroundColor: getStatusColor(ride.status) + '20' }}
                  textStyle={{ color: getStatusColor(ride.status) }}
                >
                  {getStatusText(ride.status)}
                </Chip>
              </View>
              
              <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              
              <View style={styles.routeInfo}>
                <View style={styles.route}>
                  <Paragraph style={[styles.routeLabel, { color: theme.colors.onSurfaceVariant }]}>
                    From:
                  </Paragraph>
                  <Paragraph style={[styles.routeText, { color: theme.colors.onSurface }]}>
                    {ride.from}
                  </Paragraph>
                </View>
                <View style={styles.route}>
                  <Paragraph style={[styles.routeLabel, { color: theme.colors.onSurfaceVariant }]}>
                    To:
                  </Paragraph>
                  <Paragraph style={[styles.routeText, { color: theme.colors.onSurface }]}>
                    {ride.to}
                  </Paragraph>
                </View>
              </View>
              
              <View style={styles.rideDetails}>
                <View style={styles.driverInfo}>
                  <Paragraph style={[styles.driverLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Driver:
                  </Paragraph>
                  <Paragraph style={[styles.driverName, { color: theme.colors.onSurface }]}>
                    {ride.driver}
                  </Paragraph>
                  {ride.rating && (
                    <Paragraph style={[styles.rating, { color: theme.colors.primary }]}>
                      ⭐ {ride.rating}
                    </Paragraph>
                  )}
                </View>
                <Paragraph style={[styles.price, { color: theme.colors.primary }]}>
                  {ride.price}
                </Paragraph>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  rideCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTime: {
    flex: 1,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    marginVertical: 12,
  },
  routeInfo: {
    marginBottom: 12,
  },
  route: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  routeLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 50,
  },
  routeText: {
    fontSize: 14,
    flex: 1,
    fontWeight: '600',
  },
  rideDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RecentRidesScreen;
