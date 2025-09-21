import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { View, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Title, Avatar, Paragraph, Divider, Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useAppMode } from '../context/AppModeContext';
import { DrawerActions } from '@react-navigation/native';

// Import screens
import ProfileScreen from '../screens/ProfileScreen';
import WalletScreen from '../screens/WalletScreen';
import MapTestScreen from '../screens/MapTestScreen';

// Import mode-aware wrappers
import PassengerHomeWrapper from '../components/PassengerHomeWrapper';
import DriverModeWrapper from '../components/DriverModeWrapper';
import RecentRidesWrapper from '../components/RecentRidesWrapper';

export type MainDrawerParamList = {
  Home: undefined;
  DriverMode: undefined;
  Profile: undefined;
  RecentRides: undefined;
  Wallet: undefined;
  MapTest: undefined;
};

const Drawer = createDrawerNavigator<MainDrawerParamList>();

// Custom Drawer Content
const CustomDrawerContent = (props: any) => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const { currentMode, switchMode } = useAppMode();

  const handleModeSwitch = async () => {
    try {
      // Logout user and switch mode
      await logout();
      await switchMode();
    } catch (error) {
      console.error('Error switching mode:', error);
    }
  };

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: theme.colors.surface }}>
      <View style={[styles.drawerHeader, { backgroundColor: theme.colors.primary }]}>
        <Avatar.Text 
          size={60} 
          label={user?.firstName?.charAt(0) + user?.lastName?.charAt(0) || 'U'} 
          style={{ backgroundColor: theme.colors.primaryContainer }}
        />
        <Title style={[styles.userName, { color: theme.colors.onPrimary }]}>
          {user?.firstName} {user?.lastName}
        </Title>
        <Paragraph style={[styles.userEmail, { color: theme.colors.onPrimary }]}>
          {user?.email}
        </Paragraph>
      </View>
      
      <View style={styles.drawerItems}>
        {/* Show Home (Rider) only in Passenger Mode */}
        {currentMode === 'passenger' && (
          <DrawerItem
            label="Home"
            icon={({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            )}
            onPress={() => props.navigation.navigate('Home')}
            labelStyle={{ color: theme.colors.onSurface }}
            activeTintColor={theme.colors.primary}
          />
        )}
        
        {/* Show Driver Dashboard only in Driver Mode */}
        {currentMode === 'driver' && (
          <DrawerItem
            label="Driver Dashboard"
            icon={({ color, size }) => (
              <Ionicons name="speedometer-outline" size={size} color={color} />
            )}
            onPress={() => props.navigation.navigate('DriverMode')}
            labelStyle={{ color: theme.colors.onSurface }}
            activeTintColor={theme.colors.primary}
          />
        )}
        
        {/* Show Recent Rides only in Passenger Mode */}
        {currentMode === 'passenger' && (
          <DrawerItem
            label="My Recent Rides"
            icon={({ color, size }) => (
              <Ionicons name="time-outline" size={size} color={color} />
            )}
            onPress={() => props.navigation.navigate('RecentRides')}
            labelStyle={{ color: theme.colors.onSurface }}
            activeTintColor={theme.colors.primary}
          />
        )}
        
        <Divider style={{ marginVertical: 8 }} />
        
        <DrawerItem
          label="Profile"
          icon={({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          )}
          onPress={() => props.navigation.navigate('Profile')}
          labelStyle={{ color: theme.colors.onSurface }}
          activeTintColor={theme.colors.primary}
        />
        
        <DrawerItem
          label="Wallet"
          icon={({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          )}
          onPress={() => props.navigation.navigate('Wallet')}
          labelStyle={{ color: theme.colors.onSurface }}
          activeTintColor={theme.colors.primary}
        />
        
        <Divider style={{ marginVertical: 8 }} />
        
        <DrawerItem
          label="🧪 Map Test"
          icon={({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          )}
          onPress={() => props.navigation.navigate('MapTest')}
          labelStyle={{ color: theme.colors.onSurface }}
          activeTintColor={theme.colors.primary}
        />
      </View>
      
      {/* Mode Switch Button at Bottom */}
      <View style={styles.bottomSection}>
        <Button
          mode="contained"
          onPress={handleModeSwitch}
          style={[styles.driverModeButton, { backgroundColor: theme.colors.primary }]}
          contentStyle={styles.driverModeButtonContent}
          labelStyle={[styles.driverModeText, { color: 'white' }]}
          icon={({ size }) => (
            <Ionicons 
              name={currentMode === 'passenger' ? 'car' : 'person'} 
              size={size} 
              color="white" 
            />
          )}
        >
          {currentMode === 'passenger' ? 'Driver Mode' : 'Passenger Mode'}
        </Button>
      </View>
    </DrawerContentScrollView>
  );
};



// Wrapper component to handle driver redirects
const MainNavigatorWrapper: React.FC = () => {
  return <MainNavigator />;
};

const MainNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { currentMode } = useAppMode();

  // Determine initial screen based on mode
  const getInitialRouteName = () => {
    if (currentMode === 'driver') {
      return 'DriverMode';
    } else {
      return 'Home';
    }
  };

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      initialRouteName={getInitialRouteName()}
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontWeight: '600',
        },
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: 280,
        },
        headerLeft: ({ tintColor }) => (
          <TouchableOpacity
            onPress={() => {
              console.log('Hamburger menu pressed!');
              navigation.dispatch(DrawerActions.openDrawer());
            }}
            style={{ marginLeft: 16, padding: 8 }}
            activeOpacity={0.6}
          >
            <Ionicons 
              name="menu-outline" 
              size={24} 
              color={tintColor}
            />
          </TouchableOpacity>
        ),
      })}
    >
      <Drawer.Screen 
        name="Home" 
        component={PassengerHomeWrapper}
        options={{
          title: 'Book a Ride',
          headerShown: true,
        }}
      />
      <Drawer.Screen 
        name="DriverMode" 
        component={DriverModeWrapper}
        options={{
          title: 'Driver Dashboard',
          headerShown: true,
        }}
      />
      <Drawer.Screen 
        name="RecentRides" 
        component={RecentRidesWrapper}
        options={{
          title: 'Recent Rides',
          headerShown: true,
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerShown: true,
        }}
      />
      <Drawer.Screen 
        name="Wallet" 
        component={WalletScreen}
        options={{
          title: 'Wallet',
          headerShown: true,
        }}
      />
      <Drawer.Screen 
        name="MapTest" 
        component={MapTestScreen}
        options={{
          title: '🧪 Map Test',
          headerShown: true,
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 20,
    paddingTop: 40,
    marginBottom: 16,
    alignItems: 'center',
  },
  userName: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  drawerItems: {
    paddingHorizontal: 8,
    flex: 1,
  },
  bottomSection: {
    padding: 16,
    paddingBottom: 32,
  },
  driverModeButton: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  driverModeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  driverModeText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MainNavigatorWrapper;
