import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DriverRideRequestsScreen from './DriverRideRequestsScreen';
import DriverIncomeScreen from './DriverIncomeScreen';
import DriverRatingScreen from './DriverRatingScreen';
import DriverWalletScreen from './DriverWalletScreen';

export type DriverDashboardParamList = {
  RideRequests: undefined;
  MyIncome: undefined;
  Rating: undefined;
  Wallet: undefined;
};

const Tab = createBottomTabNavigator<DriverDashboardParamList>();

const DriverDashboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Tab.Navigator
        initialRouteName="RideRequests"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            switch (route.name) {
              case 'RideRequests':
                iconName = focused ? 'list' : 'list-outline';
                break;
              case 'MyIncome':
                iconName = focused ? 'trending-up' : 'trending-up-outline';
                break;
              case 'Rating':
                iconName = focused ? 'star' : 'star-outline';
                break;
              case 'Wallet':
                iconName = focused ? 'card' : 'card-outline';
                break;
              default:
                iconName = 'help-outline';
            }

            console.log(`Tab ${route.name}: icon=${iconName}, size=${size}, color=${color}`);
            return <Ionicons name={iconName} size={size || 24} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outline,
            borderTopWidth: 1,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            paddingTop: 6,
            paddingBottom: 3,
            paddingHorizontal: 16,
            marginHorizontal: 0,
            borderRadius: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
            marginTop: 2,
            marginBottom: 0,
          },
          tabBarIconStyle: {
            marginTop: 4,
            marginBottom: 0,
          },
          tabBarItemStyle: {
            paddingVertical: 2,
            alignItems: 'center',
            justifyContent: 'center',
          },
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.surface,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.outline,
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.onSurface,
          },
          headerTitleAlign: 'center',
        })}
      >
        <Tab.Screen
          name="RideRequests"
          component={DriverRideRequestsScreen}
          options={{
            title: 'Ride requests',
            tabBarLabel: 'Ride requests',
          }}
        />
        <Tab.Screen
          name="MyIncome"
          component={DriverIncomeScreen}
          options={{
            title: 'My income',
            tabBarLabel: 'My income',
          }}
        />
        <Tab.Screen
          name="Rating"
          component={DriverRatingScreen}
          options={{
            title: 'Rating',
            tabBarLabel: 'Rating',
          }}
        />
        <Tab.Screen
          name="Wallet"
          component={DriverWalletScreen}
          options={{
            title: 'Wallet',
            tabBarLabel: 'Wallet',
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 45, // Account for fixed bottom navigation (60px height + 15px bottom margin)
  },
});

export default DriverDashboardScreen;
