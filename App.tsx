import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';

// Import theme and context
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AppModeProvider, useAppMode } from './src/context/AppModeContext';
import { lightTheme, darkTheme } from './src/theme/theme';

// Import navigators
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';

// Import components
import LoadingScreen from './src/components/LoadingScreen';

// Create a client
const queryClient = new QueryClient();

function AppContent() {
  const { theme, isDark } = useTheme();
  const { isAuthenticated, isLoading, login, register, user } = useAuth();
  const { setMode } = useAppMode();

  // Set app mode based on user type when user is loaded from storage
  useEffect(() => {
    if (user && isAuthenticated) {
      const correctMode = user.userType === 'driver' ? 'driver' : 'passenger';
      setMode(correctMode).then(() => {
        console.log(`🔧 Set app mode to ${correctMode} for user:`, user.email);
      });
    }
  }, [user, isAuthenticated, setMode]);

  const handleLogin = async (token: string, user: any) => {
    try {
      await login(token, user);
      
      // Set app mode based on user type
      if (user.userType === 'driver') {
        await setMode('driver');
        console.log('🔧 Set app mode to driver for user:', user.email);
      } else if (user.userType === 'rider') {
        await setMode('passenger');
        console.log('🔧 Set app mode to passenger for user:', user.email);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRegister = async (token: string, user: any) => {
    try {
      await register(token, user);
      
      // Set app mode based on user type
      if (user.userType === 'driver') {
        await setMode('driver');
        console.log('🔧 Set app mode to driver for new user:', user.email);
      } else if (user.userType === 'rider') {
        await setMode('passenger');
        console.log('🔧 Set app mode to passenger for new user:', user.email);
      }
    } catch (error) {
      console.error('Register error:', error);
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer 
        theme={theme}
        independent={true}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {isAuthenticated ? (
          <MainNavigator />
        ) : (
          <AuthNavigator onLogin={handleLogin} onRegister={handleRegister} />
        )}
      </NavigationContainer>
      <Toast />
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppModeProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </AppModeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
