import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useAppMode, AppMode } from '../context/AppModeContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

interface ModeAwareScreenProps {
  children: React.ReactNode;
  allowedModes: AppMode[];
  redirectTo?: string;
  fallbackMessage?: string;
}

const ModeAwareScreen: React.FC<ModeAwareScreenProps> = ({
  children,
  allowedModes,
  redirectTo,
  fallbackMessage = 'This screen is not available in the current mode'
}) => {
  const { currentMode, isLoading } = useAppMode();
  const { theme } = useTheme();
  const navigation = useNavigation();

  useEffect(() => {
    if (!isLoading && !allowedModes.includes(currentMode)) {
      if (redirectTo) {
        navigation.navigate(redirectTo as never);
      }
    }
  }, [currentMode, isLoading, allowedModes, redirectTo, navigation]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
          Loading...
        </Text>
      </View>
    );
  }

  if (!allowedModes.includes(currentMode)) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.fallbackText, { color: theme.colors.onBackground }]}>
          {fallbackMessage}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  fallbackText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default ModeAwareScreen;
