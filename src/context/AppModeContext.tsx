import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppMode = 'passenger' | 'driver';

interface AppModeContextType {
  currentMode: AppMode;
  setMode: (mode: AppMode) => Promise<void>;
  switchMode: () => Promise<void>;
  isLoading: boolean;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export const useAppMode = () => {
  const context = useContext(AppModeContext);
  if (context === undefined) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
};

interface AppModeProviderProps {
  children: React.ReactNode;
}

export const AppModeProvider: React.FC<AppModeProviderProps> = ({ children }) => {
  const [currentMode, setCurrentMode] = useState<AppMode>('passenger');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved mode on app start
  useEffect(() => {
    loadSavedMode();
  }, []);

  const loadSavedMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('app_mode');
      if (savedMode && (savedMode === 'passenger' || savedMode === 'driver')) {
        setCurrentMode(savedMode as AppMode);
      }
    } catch (error) {
      console.error('Error loading app mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setMode = async (mode: AppMode) => {
    try {
      setCurrentMode(mode);
      await AsyncStorage.setItem('app_mode', mode);
      console.log(`🔄 App mode changed to: ${mode}`);
    } catch (error) {
      console.error('Error saving app mode:', error);
    }
  };

  const switchMode = async () => {
    const newMode = currentMode === 'passenger' ? 'driver' : 'passenger';
    await setMode(newMode);
  };

  const value: AppModeContextType = {
    currentMode,
    setMode,
    switchMode,
    isLoading,
  };

  return (
    <AppModeContext.Provider value={value}>
      {children}
    </AppModeContext.Provider>
  );
};
