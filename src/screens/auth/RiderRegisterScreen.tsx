import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, Button, Card, Title, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest, API_ENDPOINTS } from '../../config/api';

const { width, height } = Dimensions.get('window');

interface RiderRegisterScreenProps {
  navigation: any;
  onRegister?: (token: string, user: any) => void;
}

const RiderRegisterScreen: React.FC<RiderRegisterScreenProps> = ({ navigation, onRegister }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    // Basic validation
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Name validation
    if (firstName.length < 2) {
      Alert.alert('Error', 'First name must be at least 2 characters long');
      return;
    }

    if (lastName.length < 2) {
      Alert.alert('Error', 'Last name must be at least 2 characters long');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const requestBody = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password,
        userType: 'rider', // Fixed as rider
      };

      const data = await apiRequest(API_ENDPOINTS.auth.register, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      // Show success message and redirect to rider login
      Alert.alert(
        'Rider Registration Successful!', 
        'Welcome to Tourist Ride! You can now sign in as a rider and start booking rides.',
        [
          { 
            text: 'Sign In Now', 
            onPress: () => navigation.replace('RiderLogin')
          }
        ]
      );

    } catch (error: any) {
      console.error('Rider registration error:', error);
      
      // Handle specific error messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error?.message) {
        if (error.message.includes('email already exists') || error.message.includes('An account with this email')) {
          errorMessage = 'An account with this email already exists. Please use a different email or try signing in.';
        } else if (error.message.includes('phone number already exists') || error.message.includes('An account with this phone')) {
          errorMessage = 'An account with this phone number already exists. Please use a different phone number or try signing in.';
        } else if (error.message.includes('validation') || error.message.includes('invalid')) {
          errorMessage = error.message;
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.headerTop}>
            <IconButton
              icon="arrow-left"
              iconColor="white"
              size={24}
              onPress={goBack}
              style={styles.backButton}
            />
          </View>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Ionicons name="person-add" size={48} color="white" />
            </View>
            <Text style={styles.appTitle}>Rider Registration</Text>
            <Text style={styles.appSubtitle}>Join as a rider and start traveling</Text>
          </View>
        </View>

        {/* Register Form */}
        <Card style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.formTitle, { color: theme.colors.onSurface }]}>
              Create Rider Account
            </Title>
            <Text style={[styles.formSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Sign up to book rides and travel with ease
            </Text>

            {/* Name Inputs */}
            <View style={styles.nameContainer}>
              <View style={[styles.nameInput, { flex: 1, marginRight: 8 }]}>
                <Ionicons name="person" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  style={styles.input}
                  mode="outlined"
                  placeholder="Enter first name"
                  theme={theme}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.nameInput, { flex: 1, marginLeft: 8 }]}>
                <Ionicons name="person" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  style={styles.input}
                  mode="outlined"
                  placeholder="Enter last name"
                  theme={theme}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                mode="outlined"
                placeholder="Enter your email"
                theme={theme}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="call" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                mode="outlined"
                placeholder="Enter phone number"
                theme={theme}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                keyboardType="phone-pad"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                mode="outlined"
                placeholder="Enter password"
                theme={theme}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                secureTextEntry={!showPassword}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                    color={theme.colors.primary}
                  />
                }
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                mode="outlined"
                placeholder="Confirm password"
                theme={theme}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                secureTextEntry={!showConfirmPassword}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    color={theme.colors.primary}
                  />
                }
              />
            </View>

            {/* Rider Benefits */}
            <View style={styles.benefitsContainer}>
              <Text style={[styles.benefitsTitle, { color: theme.colors.onSurface }]}>
                Rider Benefits:
              </Text>
              <View style={styles.benefitItem}>
                <Ionicons name="car" size={16} color={theme.colors.primary} />
                <Text style={[styles.benefitText, { color: theme.colors.onSurfaceVariant }]}>
                  Book rides anytime, anywhere
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="shield-checkmark" size={16} color={theme.colors.primary} />
                <Text style={[styles.benefitText, { color: theme.colors.onSurfaceVariant }]}>
                  Safe and secure rides
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="star" size={16} color={theme.colors.primary} />
                <Text style={[styles.benefitText, { color: theme.colors.onSurfaceVariant }]}>
                  Rate and review drivers
                </Text>
              </View>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <Text style={[styles.termsText, { color: theme.colors.onSurfaceVariant }]}>
                By signing up as a rider, you agree to our{' '}
              </Text>
              <TouchableOpacity>
                <Text style={[styles.termsLink, { color: theme.colors.primary }]}>
                  Terms of Service
                </Text>
              </TouchableOpacity>
              <Text style={[styles.termsText, { color: theme.colors.onSurfaceVariant }]}>
                {' '}and{' '}
              </Text>
              <TouchableOpacity>
                <Text style={[styles.termsLink, { color: theme.colors.primary }]}>
                  Privacy Policy
                </Text>
              </TouchableOpacity>
            </View>

            {/* Register Button */}
            <Button
              mode="contained"
              onPress={handleRegister}
              style={[styles.registerButton, { backgroundColor: theme.colors.primary }]}
              loading={isLoading}
              disabled={isLoading}
              buttonColor={theme.colors.primary}
              contentStyle={styles.registerButtonContent}
              labelStyle={[styles.registerButtonLabel, { color: '#FFFFFF' }]}
              textColor="#FFFFFF"
            >
              {isLoading ? 'Creating Rider Account...' : 'Create Rider Account'}
            </Button>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: theme.colors.onSurfaceVariant }]}>
                Already have a rider account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.replace('RiderLogin')}>
                <Text style={[styles.loginLink, { color: theme.colors.primary }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>

            {/* Switch to Driver Registration */}
            <View style={styles.switchContainer}>
              <Text style={[styles.switchText, { color: theme.colors.onSurfaceVariant }]}>
                Want to become a driver?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.replace('DriverRegister')}>
                <Text style={[styles.switchLink, { color: theme.colors.secondary }]}>
                  Driver Registration
                </Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTop: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  backButton: {
    margin: 0,
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
  formCard: {
    margin: 20,
    marginTop: -20,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  nameInput: {
    position: 'relative',
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  input: {
    paddingLeft: 40,
  },
  benefitsContainer: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    marginLeft: 8,
  },
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  termsText: {
    fontSize: 14,
  },
  termsLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  registerButton: {
    borderRadius: 12,
    elevation: 2,
    marginBottom: 24,
  },
  registerButtonContent: {
    paddingVertical: 8,
  },
  registerButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginText: {
    fontSize: 16,
  },
  loginLink: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 16,
  },
  switchLink: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RiderRegisterScreen;
