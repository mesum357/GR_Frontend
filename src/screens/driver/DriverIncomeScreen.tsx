import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Card, Title, Button, ActivityIndicator, Chip, SegmentedButtons } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { authenticatedApiRequest } from '../../config/api';

const { width } = Dimensions.get('window');

interface EarningsData {
  totalEarnings: number;
  ridesCompleted: number;
  averageRating: number;
  hoursOnline: number;
  tips: number;
  bonuses: number;
}

interface DailyEarning {
  date: string;
  amount: number;
  rides: number;
  hours: number;
}

const DriverIncomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { token, user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalEarnings: 127.45,
    ridesCompleted: 23,
    averageRating: 4.8,
    hoursOnline: 18.5,
    tips: 15.30,
    bonuses: 8.50
  });
  const [dailyEarnings, setDailyEarnings] = useState<DailyEarning[]>([
    { date: 'Mon', amount: 28.75, rides: 5, hours: 3.5 },
    { date: 'Tue', amount: 32.40, rides: 6, hours: 4.0 },
    { date: 'Wed', amount: 19.80, rides: 3, hours: 2.5 },
    { date: 'Thu', amount: 25.90, rides: 4, hours: 3.0 },
    { date: 'Fri', amount: 20.60, rides: 5, hours: 5.5 },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchIncomeData();
  }, [selectedPeriod]);

  const fetchIncomeData = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      // const data = await authenticatedApiRequest(`/api/drivers/earnings?period=${selectedPeriod}`, token);
      // setEarningsData(data.earnings);
      // setDailyEarnings(data.dailyEarnings);
    } catch (error) {
      console.error('Error fetching income data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchIncomeData();
  };

  const maxDailyAmount = Math.max(...dailyEarnings.map(d => d.amount));

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
          Loading income data...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <SegmentedButtons
          value={selectedPeriod}
          onValueChange={setSelectedPeriod}
          buttons={[
            { value: 'day', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Total Earnings Card */}
      <Card style={[styles.earningsCard, { backgroundColor: theme.colors.primary }]} elevation={4}>
        <Card.Content style={styles.earningsContent}>
          <View style={styles.earningsHeader}>
            <Ionicons name="cash" size={32} color="#FFFFFF" />
            <Text style={styles.earningsLabel}>Total Earnings</Text>
          </View>
          <Text style={styles.earningsAmount}>${earningsData.totalEarnings.toFixed(2)}</Text>
          <Text style={styles.earningsPeriod}>This {selectedPeriod}</Text>
        </Card.Content>
      </Card>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content style={styles.statContent}>
            <Ionicons name="car" size={24} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
              {earningsData.ridesCompleted}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Rides
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content style={styles.statContent}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
              {earningsData.averageRating.toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Rating
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content style={styles.statContent}>
            <Ionicons name="time" size={24} color={theme.colors.secondary} />
            <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
              {earningsData.hoursOnline.toFixed(1)}h
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Online
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Earnings Breakdown */}
      <Card style={[styles.breakdownCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            Earnings Breakdown
          </Title>

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <Ionicons name="car" size={20} color={theme.colors.primary} />
              <Text style={[styles.breakdownLabel, { color: theme.colors.onSurface }]}>
                Trip Earnings
              </Text>
            </View>
            <Text style={[styles.breakdownAmount, { color: theme.colors.onSurface }]}>
              ${(earningsData.totalEarnings - earningsData.tips - earningsData.bonuses).toFixed(2)}
            </Text>
          </View>

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <Ionicons name="heart" size={20} color="#E91E63" />
              <Text style={[styles.breakdownLabel, { color: theme.colors.onSurface }]}>
                Tips
              </Text>
            </View>
            <Text style={[styles.breakdownAmount, { color: theme.colors.onSurface }]}>
              ${earningsData.tips.toFixed(2)}
            </Text>
          </View>

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <Ionicons name="gift" size={20} color="#FF9800" />
              <Text style={[styles.breakdownLabel, { color: theme.colors.onSurface }]}>
                Bonuses
              </Text>
            </View>
            <Text style={[styles.breakdownAmount, { color: theme.colors.onSurface }]}>
              ${earningsData.bonuses.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.breakdownItem, styles.totalItem, { borderTopColor: theme.colors.outline }]}>
            <View style={styles.breakdownLeft}>
              <Ionicons name="cash" size={20} color={theme.colors.primary} />
              <Text style={[styles.breakdownLabel, styles.totalLabel, { color: theme.colors.onSurface }]}>
                Total
              </Text>
            </View>
            <Text style={[styles.breakdownAmount, styles.totalAmount, { color: theme.colors.primary }]}>
              ${earningsData.totalEarnings.toFixed(2)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Daily Earnings Chart */}
      <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            Daily Earnings
          </Title>

          <View style={styles.chartContainer}>
            {dailyEarnings.map((day, index) => (
              <View key={index} style={styles.chartDay}>
                <View style={styles.chartBar}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        backgroundColor: theme.colors.primary,
                        height: `${(day.amount / maxDailyAmount) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.chartAmount, { color: theme.colors.onSurface }]}>
                  ${day.amount.toFixed(0)}
                </Text>
                <Text style={[styles.chartDate, { color: theme.colors.onSurfaceVariant }]}>
                  {day.date}
                </Text>
                <Text style={[styles.chartRides, { color: theme.colors.onSurfaceVariant }]}>
                  {day.rides} rides
                </Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Performance Tips */}
      <Card style={[styles.tipsCard, { backgroundColor: theme.colors.tertiary + '20' }]} elevation={2}>
        <Card.Content>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={24} color={theme.colors.tertiary} />
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface, marginLeft: 8 }]}>
              Earnings Tips
            </Title>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="time" size={16} color={theme.colors.tertiary} />
            <Text style={[styles.tipText, { color: theme.colors.onSurface }]}>
              Drive during peak hours (7-9 AM, 5-7 PM) for higher demand
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="location" size={16} color={theme.colors.tertiary} />
            <Text style={[styles.tipText, { color: theme.colors.onSurface }]}>
              Stay near airports, malls, and business districts
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="star" size={16} color={theme.colors.tertiary} />
            <Text style={[styles.tipText, { color: theme.colors.onSurface }]}>
              Maintain a high rating to get more ride requests
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
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
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  periodSelector: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  segmentedButtons: {
    marginHorizontal: 0,
  },
  earningsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
  },
  earningsContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  earningsLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  earningsAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  earningsPeriod: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  breakdownCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  breakdownAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalItem: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginTop: 16,
  },
  chartDay: {
    flex: 1,
    alignItems: 'center',
  },
  chartBar: {
    width: 24,
    height: 80,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 12,
    minHeight: 4,
  },
  chartAmount: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  chartDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  chartRides: {
    fontSize: 10,
  },
  tipsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});

export default DriverIncomeScreen;
