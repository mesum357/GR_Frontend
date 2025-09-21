import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, Switch, Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LogoutTest from '../components/LogoutTest';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { MainDrawerParamList } from '../navigation/MainNavigator';

const mockUser = {
  name: 'Ahmed Khan',
  email: 'ahmed.khan@example.com',
  phone: '+92 300 1234567',
  rating: 4.8,
  totalRides: 156,
  memberSince: '2023',
  vehicle: 'Toyota Corolla',
  plateNumber: 'GB-1234',
  isOnline: false,
};

const mockStats = {
  totalEarnings: 45000,
  thisMonth: 8500,
  totalRides: 156,
  averageRating: 4.8,
};

interface ProfileScreenProps {
  navigation: DrawerNavigationProp<MainDrawerParamList, 'Profile'>;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(mockUser.isOnline);
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Show loading state
              Toast.show({
                type: 'info',
                text1: 'Logging out...',
                position: 'bottom',
              });
              
              await logout();
              
              // Show success message
              Toast.show({
                type: 'success',
                text1: 'Logged out successfully',
                text2: 'You have been signed out of your account',
                position: 'bottom',
              });
            } catch (error) {
              console.error('Logout error:', error);
              Toast.show({
                type: 'error',
                text1: 'Logout failed',
                text2: 'Please try again',
                position: 'bottom',
              });
            }
          }
        }
      ]
    );
  };

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
    Toast.show({
      type: 'success',
      text1: isOnline ? "You're now offline" : "You're now online",
    });
  };

  const ProfileMenuItem = ({ icon, title, subtitle, onPress, showArrow = true }: any) => (
    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.colors.outline }]} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIcon, { backgroundColor: theme.colors.primaryContainer }]}>
          <Ionicons name={icon} size={20} color={theme.colors.onPrimaryContainer} />
        </View>
        <View style={styles.menuText}>
          <Text style={[styles.menuTitle, { color: theme.colors.onSurface }]}>{title}</Text>
          {subtitle && <Text style={[styles.menuSubtitle, { color: theme.colors.onSurfaceVariant }]}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && <Ionicons name="chevron-forward" size={16} color={theme.colors.onSurfaceVariant} />}
    </TouchableOpacity>
  );

  const StatCard = ({ icon, value, label, color }: any) => (
    <Card style={[styles.statCard, { 
      backgroundColor: theme.colors.surface,
      borderLeftColor: color 
    }]}>
      <Card.Content style={styles.statContent}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 120 + insets.bottom : 120,
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>Profile</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>Manage your account</Text>
          </View>
        </View>

        {/* Profile Card */}
        <Card style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <Avatar.Text 
                size={80} 
                label={mockUser.name.split(' ').map(n => n[0]).join('')}
                style={{ backgroundColor: theme.colors.primary }}
                labelStyle={{ color: theme.colors.onPrimary, fontSize: 24 }}
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.colors.onSurface }]}>{mockUser.name}</Text>
                <Text style={[styles.profileEmail, { color: theme.colors.onSurfaceVariant }]}>{mockUser.email}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color={theme.colors.accent} />
                  <Text style={[styles.rating, { color: theme.colors.onSurfaceVariant }]}>{mockUser.rating}</Text>
                  <Text style={[styles.ratingText, { color: theme.colors.onSurfaceVariant }]}> • {mockUser.totalRides} rides</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="cash"
              value={`PKR ${mockStats.totalEarnings.toLocaleString()}`}
              label="Total Earnings"
              color={theme.colors.primary}
            />
            <StatCard
              icon="trending-up"
              value={`PKR ${mockStats.thisMonth.toLocaleString()}`}
              label="This Month"
              color={theme.colors.secondary}
            />
            <StatCard
              icon="car"
              value={mockStats.totalRides}
              label="Total Rides"
              color={theme.colors.accent}
            />
            <StatCard
              icon="star"
              value={mockStats.averageRating}
              label="Rating"
              color={theme.colors.primaryVariant}
            />
          </View>
        </View>

        {/* Settings */}
        <Card style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Settings</Title>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="toggle" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>Go Online</Text>
              </View>
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>Notifications</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="location" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>Location Sharing</Text>
              </View>
              <Switch
                value={locationSharing}
                onValueChange={setLocationSharing}
                color={theme.colors.primary}
              />
            </View>

            {/* Dark Mode Toggle */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons 
                  name={isDark ? 'moon' : 'sunny'} 
                  size={20} 
                  color={theme.colors.primary} 
                />
                <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                color={theme.colors.primary}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Menu Items */}
        <Card style={[styles.menuCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Account</Title>
            
            <ProfileMenuItem
              icon="person"
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={() => {}}
            />
            
            <ProfileMenuItem
              icon="car"
              title="Vehicle Information"
              subtitle={`${mockUser.vehicle} - ${mockUser.plateNumber}`}
              onPress={() => {}}
            />
            
            <ProfileMenuItem
              icon="card"
              title="Payment Methods"
              subtitle="Manage your payment options"
              onPress={() => {}}
            />
            
            <ProfileMenuItem
              icon="shield-checkmark"
              title="Privacy & Security"
              subtitle="Manage your privacy settings"
              onPress={() => {}}
            />
            
            <ProfileMenuItem
              icon="help-circle"
              title="Help & Support"
              subtitle="Get help and contact support"
              onPress={() => {}}
            />
            
            <ProfileMenuItem
              icon="map"
              title="🧪 Map Test"
              subtitle="Debug Android map loading issues"
              onPress={() => navigation.navigate('MapTest')}
            />
            
            {/* Logout Button - Custom Styling */}
            <TouchableOpacity 
              style={[styles.logoutItem, { borderBottomColor: theme.colors.outline }]} 
              onPress={handleLogout}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.logoutIcon, { backgroundColor: theme.colors.errorContainer }]}>
                  <Ionicons name="log-out" size={20} color={theme.colors.onErrorContainer} />
                </View>
                <View style={styles.menuText}>
                  <Text style={[styles.logoutTitle, { color: theme.colors.error }]}>Logout</Text>
                  <Text style={[styles.menuSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Sign out of your account
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Logout Test Component - Remove this after testing */}
        <LogoutTest />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  profileCard: {
    margin: 20,
    borderRadius: 16,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingText: {
    fontSize: 14,
  },
  statsSection: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderLeftWidth: 4,
    borderRadius: 12,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  settingsCard: {
    margin: 20,
    borderRadius: 16,
    elevation: 4,
  },
  menuCard: {
    margin: 20,
    borderRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
  },
  logoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
});
