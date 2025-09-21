import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Card, Title, Avatar, ActivityIndicator, Chip, ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { authenticatedApiRequest } from '../../config/api';

const { width } = Dimensions.get('window');

interface RatingBreakdown {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  date: string;
  riderName: string;
  riderAvatar?: string;
  tripDetails: string;
}

const DriverRatingScreen: React.FC = () => {
  const { theme } = useTheme();
  const { token, user } = useAuth();
  const [overallRating, setOverallRating] = useState(4.8);
  const [totalRatings, setTotalRatings] = useState(247);
  const [ratingBreakdown, setRatingBreakdown] = useState<RatingBreakdown>({
    5: 198,
    4: 35,
    3: 10,
    2: 3,
    1: 1
  });
  const [recentReviews, setRecentReviews] = useState<Review[]>([
    {
      id: '1',
      rating: 5,
      comment: 'Great driver! Very professional and safe driving. Car was clean and comfortable.',
      date: '2 days ago',
      riderName: 'Sarah M.',
      tripDetails: 'Airport to Downtown'
    },
    {
      id: '2',
      rating: 5,
      comment: 'Excellent service! On time and friendly. Definitely recommend.',
      date: '3 days ago',
      riderName: 'John D.',
      tripDetails: 'Mall to Residential'
    },
    {
      id: '3',
      rating: 4,
      comment: 'Good ride, driver was polite but took a longer route.',
      date: '1 week ago',
      riderName: 'Lisa K.',
      tripDetails: 'Business District to Hotel'
    },
    {
      id: '4',
      rating: 5,
      comment: 'Amazing driver! Helped with luggage and very courteous.',
      date: '1 week ago',
      riderName: 'Mike R.',
      tripDetails: 'Hotel to Airport'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRatingData();
  }, []);

  const fetchRatingData = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      // const data = await authenticatedApiRequest('/api/drivers/ratings', token);
      // setOverallRating(data.overallRating);
      // setTotalRatings(data.totalRatings);
      // setRatingBreakdown(data.ratingBreakdown);
      // setRecentReviews(data.recentReviews);
    } catch (error) {
      console.error('Error fetching rating data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRatingData();
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={size}
          color="#FFD700"
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const getRatingPercentage = (ratingValue: number) => {
    return totalRatings > 0 ? (ratingBreakdown[ratingValue as keyof RatingBreakdown] / totalRatings) * 100 : 0;
  };

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
          Loading ratings...
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
      {/* Overall Rating Card */}
      <Card style={[styles.overallCard, { backgroundColor: theme.colors.surface }]} elevation={4}>
        <Card.Content style={styles.overallContent}>
          <View style={styles.ratingDisplay}>
            <Text style={[styles.overallRating, { color: theme.colors.onSurface }]}>
              {overallRating.toFixed(1)}
            </Text>
            <View style={styles.ratingInfo}>
              {renderStars(Math.floor(overallRating), 20)}
              <Text style={[styles.totalRatings, { color: theme.colors.onSurfaceVariant }]}>
                Based on {totalRatings} ratings
              </Text>
            </View>
          </View>
          
          <View style={styles.ratingBadge}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={[styles.badgeText, { color: theme.colors.onSurface }]}>
              Excellent Driver
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Rating Breakdown */}
      <Card style={[styles.breakdownCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            Rating Breakdown
          </Title>

          {[5, 4, 3, 2, 1].map((rating) => (
            <View key={rating} style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <Text style={[styles.ratingNumber, { color: theme.colors.onSurface }]}>
                  {rating}
                </Text>
                <Ionicons name="star" size={16} color="#FFD700" />
              </View>
              
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={getRatingPercentage(rating) / 100}
                  color={theme.colors.primary}
                  style={styles.progressBar}
                />
              </View>
              
              <View style={styles.breakdownRight}>
                <Text style={[styles.ratingCount, { color: theme.colors.onSurfaceVariant }]}>
                  {ratingBreakdown[rating as keyof RatingBreakdown]}
                </Text>
                <Text style={[styles.ratingPercentage, { color: theme.colors.onSurfaceVariant }]}>
                  ({getRatingPercentage(rating).toFixed(0)}%)
                </Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Performance Metrics */}
      <Card style={[styles.metricsCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            Performance Metrics
          </Title>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                <Ionicons name="thumbs-up" size={24} color={theme.colors.primary} />
              </View>
              <Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>
                95%
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                Satisfaction Rate
              </Text>
            </View>

            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
                <Ionicons name="time" size={24} color={theme.colors.secondary} />
              </View>
              <Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>
                2.1 min
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                Avg. Pickup Time
              </Text>
            </View>

            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: `${theme.colors.tertiary}20` }]}>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.tertiary} />
              </View>
              <Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>
                98%
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                Completion Rate
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Recent Reviews */}
      <Card style={[styles.reviewsCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            Recent Reviews
          </Title>

          {recentReviews.map((review) => (
            <View key={review.id} style={[styles.reviewItem, { borderBottomColor: theme.colors.outline }]}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                  <Avatar.Text 
                    size={40} 
                    label={review.riderName[0]} 
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <View style={styles.reviewerDetails}>
                    <Text style={[styles.reviewerName, { color: theme.colors.onSurface }]}>
                      {review.riderName}
                    </Text>
                    <Text style={[styles.reviewDate, { color: theme.colors.onSurfaceVariant }]}>
                      {review.date}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.reviewRating}>
                  {renderStars(review.rating, 14)}
                </View>
              </View>

              <Text style={[styles.reviewComment, { color: theme.colors.onSurface }]}>
                {review.comment}
              </Text>

              <Chip
                icon="car"
                style={[styles.tripChip, { backgroundColor: `${theme.colors.primary}10` }]}
                textStyle={[styles.tripChipText, { color: theme.colors.primary }]}
              >
                {review.tripDetails}
              </Chip>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Tips for Better Ratings */}
      <Card style={[styles.tipsCard, { backgroundColor: theme.colors.tertiary + '20' }]} elevation={2}>
        <Card.Content>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={24} color={theme.colors.tertiary} />
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface, marginLeft: 8 }]}>
              Tips for Better Ratings
            </Title>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.tertiary} />
            <Text style={[styles.tipText, { color: theme.colors.onSurface }]}>
              Arrive on time and communicate with riders
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.tertiary} />
            <Text style={[styles.tipText, { color: theme.colors.onSurface }]}>
              Keep your vehicle clean and comfortable
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.tertiary} />
            <Text style={[styles.tipText, { color: theme.colors.onSurface }]}>
              Drive safely and follow traffic rules
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.tertiary} />
            <Text style={[styles.tipText, { color: theme.colors.onSurface }]}>
              Be polite and maintain professionalism
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
  overallCard: {
    margin: 20,
    borderRadius: 16,
  },
  overallContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  ratingDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  overallRating: {
    fontSize: 56,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingInfo: {
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  totalRatings: {
    fontSize: 14,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },
  ratingNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  breakdownRight: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    justifyContent: 'flex-end',
  },
  ratingCount: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingPercentage: {
    fontSize: 12,
  },
  metricsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  reviewsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
  },
  reviewItem: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewerDetails: {
    marginLeft: 12,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewRating: {
    marginLeft: 8,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  tripChip: {
    alignSelf: 'flex-start',
  },
  tripChipText: {
    fontSize: 12,
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

export default DriverRatingScreen;
