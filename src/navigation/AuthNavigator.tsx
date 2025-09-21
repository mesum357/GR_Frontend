import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginTypeSelectorScreen from '../screens/auth/LoginTypeSelectorScreen';
import RiderLoginScreen from '../screens/auth/RiderLoginScreen';
import DriverLoginScreen from '../screens/auth/DriverLoginScreen';
import RiderRegisterScreen from '../screens/auth/RiderRegisterScreen';
import DriverRegisterScreen from '../screens/auth/DriverRegisterScreen';

export type AuthStackParamList = {
  LoginTypeSelector: undefined;
  RiderLogin: undefined;
  DriverLogin: undefined;
  RiderRegister: undefined;
  DriverRegister: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

interface AuthNavigatorProps {
  onLogin: (token: string, user: any) => void;
  onRegister: (token: string, user: any) => void;
}

const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onLogin, onRegister }) => {
  return (
    <Stack.Navigator
      initialRouteName="LoginTypeSelector"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="LoginTypeSelector" component={LoginTypeSelectorScreen} />
      <Stack.Screen name="RiderLogin">
        {(props) => <RiderLoginScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
      <Stack.Screen name="DriverLogin">
        {(props) => <DriverLoginScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
      <Stack.Screen name="RiderRegister">
        {(props) => <RiderRegisterScreen {...props} onRegister={onRegister} />}
      </Stack.Screen>
      <Stack.Screen name="DriverRegister">
        {(props) => <DriverRegisterScreen {...props} onRegister={onRegister} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default AuthNavigator;
