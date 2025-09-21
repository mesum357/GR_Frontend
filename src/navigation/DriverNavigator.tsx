import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';

// Import screens
import DriverScreen from '../screens/DriverScreen';
import DriverRegistrationScreen from '../screens/DriverRegistrationScreen';

export type DriverStackParamList = {
  DriverHome: undefined;
  DriverRegistration: undefined;
};

const Stack = createStackNavigator<DriverStackParamList>();

const DriverNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShown: false,
      }}
    >
      <Stack.Screen name="DriverHome" component={DriverScreen} />
      <Stack.Screen 
        name="DriverRegistration" 
        component={DriverRegistrationScreen}
        options={{
          headerShown: true,
          title: 'Driver Registration',
        }}
      />
    </Stack.Navigator>
  );
};

export default DriverNavigator;
