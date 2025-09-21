import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const LogoutTest: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme } = useTheme();

  const handleTestLogout = async () => {
    try {
      console.log('Testing logout...');
      console.log('Before logout - User:', user);
      console.log('Before logout - IsAuthenticated:', isAuthenticated);
      
      await logout();
      
      console.log('After logout - User should be null');
      console.log('After logout - IsAuthenticated should be false');
    } catch (error) {
      console.error('Test logout failed:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>
        Logout Test Component
      </Text>
      
      <Text style={[styles.status, { color: theme.colors.onSurfaceVariant }]}>
        Authentication Status: {isAuthenticated ? 'Logged In' : 'Logged Out'}
      </Text>
      
      {user && (
        <Text style={[styles.userInfo, { color: theme.colors.onSurfaceVariant }]}>
          Current User: {user.firstName} {user.lastName}
        </Text>
      )}
      
      <Button
        mode="contained"
        onPress={handleTestLogout}
        style={[styles.button, { backgroundColor: theme.colors.error }]}
        buttonColor={theme.colors.error}
      >
        Test Logout
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    margin: 20,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  status: {
    fontSize: 14,
    marginBottom: 8,
  },
  userInfo: {
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});

export default LogoutTest;
