import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';

// Import theme and context
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AppModeProvider } from './src/context/AppModeContext';
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
  const { isAuthenticated, isLoading, login, register } = useAuth();

  const handleLogin = async (token: string, user: any) => {
    try {
      await login(token, user);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRegister = async (token: string, user: any) => {
    try {
      await register(token, user);
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
