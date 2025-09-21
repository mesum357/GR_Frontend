import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Green professional color palette
export const colors = {
  light: {
    primary: '#80CBC4', // Teal/cyan theme color
    primaryVariant: '#4A6363', // Darker teal
    secondary: '#4A6363', // Complementary teal
    secondaryVariant: '#2E4A4A', // Darker complementary
    accent: '#80CBC4', // Teal accent
    background: '#FFFFFF',
    surface: '#F8F9FA',
    surfaceVariant: '#F1F3F4',
    error: '#D32F2F',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#1A1A1A',
    onSurface: '#1A1A1A',
    onSurfaceVariant: '#5F6368',
    onError: '#FFFFFF',
    outline: '#E0E0E0',
    outlineVariant: '#C8C8C8',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#1A1A1A',
    inverseOnSurface: '#FFFFFF',
    inversePrimary: '#81C784',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
      level4: '#FFFFFF',
      level5: '#FFFFFF',
    },
  },
  dark: {
    primary: '#80CBC4', // Teal/cyan theme color for dark mode
    primaryVariant: '#4A6363', // Darker teal
    secondary: '#4A6363', // Complementary teal
    secondaryVariant: '#2E4A4A', // Darker complementary
    accent: '#80CBC4', // Teal accent
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2D2D2D',
    error: '#F44336',
    onPrimary: '#000000',
    onSecondary: '#000000',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#B3B3B3',
    onError: '#000000',
    outline: '#424242',
    outlineVariant: '#616161',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#FFFFFF',
    inverseOnSurface: '#1A1A1A',
    inversePrimary: '#2E7D32',
    elevation: {
      level0: 'transparent',
      level1: '#1E1E1E',
      level2: '#2D2D2D',
      level3: '#424242',
      level4: '#616161',
      level5: '#757575',
    },
  },
};

// Create custom themes
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...colors.light,
  },
  roundness: 12,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...colors.dark,
  },
  roundness: 12,
};

// Additional custom colors for specific components
export const customColors = {
  buttonPrimary: '#80CBC4',
  buttonSecondary: '#4A6363',
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
  gradientStart: '#80CBC4',
  gradientEnd: '#4A6363',
};
