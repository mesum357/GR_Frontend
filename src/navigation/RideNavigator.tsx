import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';

// Import screens
import RiderScreen from '../screens/RiderScreen';
import SelectRiderScreen from '../screens/SelectRiderScreen';
import RequestStatusScreen from '../screens/RequestStatusScreen';

export type RideStackParamList = {
  RiderHome: undefined;
  SelectRider: {
    pickupLocation: {
      latitude: number;
      longitude: number;
      address: string;
    };
    destination: {
      latitude: number;
      longitude: number;
      address: string;
    };
  };
  RequestStatus: {
    requestId: string;
    pickupLocation: {
      latitude: number;
      longitude: number;
      address: string;
    };
    destination: {
      latitude: number;
      longitude: number;
      address: string;
    };
  };
};

const Stack = createStackNavigator<RideStackParamList>();

const RideNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="RiderHome" component={RiderScreen} />
      <Stack.Screen name="SelectRider" component={SelectRiderScreen} />
      <Stack.Screen name="RequestStatus" component={RequestStatusScreen} />
    </Stack.Navigator>
  );
};

export default RideNavigator;
