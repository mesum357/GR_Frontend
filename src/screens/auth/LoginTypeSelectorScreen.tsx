import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Card, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface LoginTypeSelectorScreenProps {
  navigation: any;
}

const LoginTypeSelectorScreen: React.FC<LoginTypeSelectorScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const handleRiderLogin = () => {
    navigation.navigate('RiderLogin');
  };

  const handleDriverLogin = () => {
    navigation.navigate('DriverLogin');
  };

  const handleRiderRegister = () => {
    navigation.navigate('RiderRegister');
  };

  const handleDriverRegister = () => {
    navigation.navigate('DriverRegister');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Ionicons name="car-sport" size={48} color="white" />
            </View>
            <Text style={styles.appTitle}>Tourist Ride</Text>
            <Text style={styles.appSubtitle}>Your journey starts here</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
        <Text style={[styles.welcomeText, { color: theme.colors.onSurface }]}>
          Welcome Back!
        </Text>
        <Text style={[styles.subtitleText, { color: theme.colors.onSurfaceVariant }]}>
          Choose how you'd like to sign in
        </Text>

        {/* Login Options */}
        <View style={styles.optionsContainer}>
          {/* Rider Login */}
          <TouchableOpacity onPress={handleRiderLogin} activeOpacity={0.8}>
            <Card style={[styles.optionCard, { backgroundColor: theme.colors.surface }]} elevation={4}>
              <Card.Content style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}20` }]}>
                  <Ionicons name="person" size={32} color={theme.colors.primary} />
                </View>
                <Text style={[styles.optionTitle, { color: theme.colors.onSurface }]}>
                  Rider Login
                </Text>
                <Text style={[styles.optionDescription, { color: theme.colors.onSurfaceVariant }]}>
                  Book rides and travel with ease
                </Text>
                <Button
                  mode="contained"
                  style={[styles.optionButton, { backgroundColor: theme.colors.primary }]}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  onPress={handleRiderLogin}
                >
                  Sign In as Rider
                </Button>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* Driver Login */}
          <TouchableOpacity onPress={handleDriverLogin} activeOpacity={0.8}>
            <Card style={[styles.optionCard, { backgroundColor: theme.colors.surface }]} elevation={4}>
              <Card.Content style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.secondary}20` }]}>
                  <Ionicons name="car" size={32} color={theme.colors.secondary} />
                </View>
                <Text style={[styles.optionTitle, { color: theme.colors.onSurface }]}>
                  Driver Login
                </Text>
                <Text style={[styles.optionDescription, { color: theme.colors.onSurfaceVariant }]}>
                  Start earning by giving rides
                </Text>
                <Button
                  mode="contained"
                  style={[styles.optionButton, { backgroundColor: theme.colors.secondary }]}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  onPress={handleDriverLogin}
                >
                  Sign In as Driver
                </Button>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Register Links */}
        <View style={styles.registerContainer}>
          <Text style={[styles.registerText, { color: theme.colors.onSurfaceVariant }]}>
            Don't have an account?
          </Text>
        </View>
        <View style={styles.registerLinksContainer}>
          <TouchableOpacity onPress={handleRiderRegister} style={styles.registerButton}>
            <Text style={[styles.registerLink, { color: theme.colors.primary }]}>
              Sign Up as Rider
            </Text>
          </TouchableOpacity>
          <Text style={[styles.registerDivider, { color: theme.colors.onSurfaceVariant }]}>
            or
          </Text>
          <TouchableOpacity onPress={handleDriverRegister} style={styles.registerButton}>
            <Text style={[styles.registerLink, { color: theme.colors.secondary }]}>
              Sign Up as Driver
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    minHeight: height * 0.6,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  optionsContainer: {
    gap: 20,
    marginBottom: 40,
  },
  optionCard: {
    borderRadius: 16,
    marginHorizontal: 4,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  optionButton: {
    borderRadius: 12,
    elevation: 2,
    minWidth: 160,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  registerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  registerText: {
    fontSize: 16,
    textAlign: 'center',
  },
  registerLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
    flexWrap: 'wrap',
  },
  registerButton: {
    paddingHorizontal: 8,
  },
  registerLink: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerDivider: {
    fontSize: 16,
    marginHorizontal: 12,
  },
});

export default LoginTypeSelectorScreen;
