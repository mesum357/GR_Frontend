import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticatedApiRequest } from '../config/api';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: 'rider' | 'driver';
  rating: number;
  totalRides: number;
  wallet: {
    balance: number;
    currency: string;
  };
  isOnline: boolean;
  isVerified: boolean;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  register: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  // Load stored authentication data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('authUser');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, userData: User) => {
    try {
      await AsyncStorage.setItem('authToken', newToken);
      await AsyncStorage.setItem('authUser', JSON.stringify(userData));
      
      setToken(newToken);
      setUser(userData);
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  };

  const register = async (newToken: string, userData: User) => {
    try {
      await AsyncStorage.setItem('authToken', newToken);
      await AsyncStorage.setItem('authUser', JSON.stringify(userData));
      
      setToken(newToken);
      setUser(userData);
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear all authentication data
      await AsyncStorage.multiRemove(['authToken', 'authUser']);
      
      // Reset state
      setToken(null);
      setUser(null);
      
      // Optional: Clear any other app data if needed
      // await AsyncStorage.clear(); // Uncomment if you want to clear all app data
      
      console.log('Logout successful - all auth data cleared');
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Update stored user data
      AsyncStorage.setItem('authUser', JSON.stringify(updatedUser)).catch(error => {
        console.error('Error updating stored user:', error);
      });
    }
  };

  const refreshUser = async () => {
    if (!token) {
      console.warn('No token available for refresh');
      return;
    }

    try {
      console.log('🔄 Refreshing user data...');
      const userData = await authenticatedApiRequest('/api/users/profile');
      
      if (userData.user) {
        const updatedUser = userData.user;
        setUser(updatedUser);
        
        // Update stored user data
        await AsyncStorage.setItem('authUser', JSON.stringify(updatedUser));
        console.log('✅ User data refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
