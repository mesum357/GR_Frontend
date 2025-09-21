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

interface DriverRegisterScreenProps {
  navigation: any;
  onRegister?: (token: string, user: any) => void;
}

const DriverRegisterScreen: React.FC<DriverRegisterScreenProps> = ({ navigation, onRegister }) => {
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
  
  // Driver-specific fields
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');

  const handleRegister = async () => {
    // Basic validation
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all personal information fields');
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

    // Driver-specific validation
    if (!vehicleMake || !vehicleModel || !vehicleYear || !vehicleColor || !plateNumber || !licenseNumber || !insuranceNumber) {
      Alert.alert('Error', 'Please fill in all vehicle and driver information fields');
      return;
    }

    // Vehicle year validation
    const currentYear = new Date().getFullYear();
    const year = parseInt(vehicleYear);
    if (isNaN(year) || year < 1990 || year > currentYear + 1) {
      Alert.alert('Error', 'Please enter a valid vehicle year (1990 - ' + (currentYear + 1) + ')');
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
        userType: 'driver', // Fixed as driver
        driverInfo: {
          vehicleInfo: {
            make: vehicleMake.trim(),
            model: vehicleModel.trim(),
            year: parseInt(vehicleYear),
            color: vehicleColor.trim(),
            plateNumber: plateNumber.trim().toUpperCase(),
            vehicleType: 'car',
          },
          licenseNumber: licenseNumber.trim(),
          licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          insuranceNumber: insuranceNumber.trim(),
          insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        },
      };

      const data = await apiRequest(API_ENDPOINTS.auth.register, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      // Show success message and redirect to driver login
      Alert.alert(
        'Driver Registration Successful!', 
        'Welcome to Tourist Ride! You can now sign in as a driver and start earning.',
        [
          { 
            text: 'Sign In Now', 
            onPress: () => navigation.replace('DriverLogin')
          }
        ]
      );

    } catch (error: any) {
      console.error('Driver registration error:', error);
      
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
        <View style={[styles.header, { backgroundColor: theme.colors.secondary }]}>
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
              <Ionicons name="car-sport" size={48} color="white" />
            </View>
            <Text style={styles.appTitle}>Driver Registration</Text>
            <Text style={styles.appSubtitle}>Join as a driver and start earning</Text>
          </View>
        </View>

        {/* Register Form */}
        <Card style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.formTitle, { color: theme.colors.onSurface }]}>
              Create Driver Account
            </Title>
            <Text style={[styles.formSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Sign up to start earning by giving rides
            </Text>

            {/* Personal Information Section */}
            <View style={styles.sectionDivider}>
              <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>
                Personal Information
              </Text>
            </View>

            {/* Name Inputs */}
            <View style={styles.nameContainer}>
              <View style={[styles.nameInput, { flex: 1, marginRight: 8 }]}>
                <Ionicons name="person" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
                <TextInput
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  style={styles.input}
                  mode="outlined"
                  placeholder="Enter first name"
                  theme={theme}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.secondary}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.nameInput, { flex: 1, marginLeft: 8 }]}>
                <Ionicons name="person" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
                <TextInput
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  style={styles.input}
                  mode="outlined"
                  placeholder="Enter last name"
                  theme={theme}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.secondary}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                mode="outlined"
                placeholder="Enter your email"
                theme={theme}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.secondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="call" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
              <TextInput
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                mode="outlined"
                placeholder="Enter phone number"
                theme={theme}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.secondary}
                keyboardType="phone-pad"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                mode="outlined"
                placeholder="Enter password"
                theme={theme}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.secondary}
                secureTextEntry={!showPassword}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                    color={theme.colors.secondary}
                  />
                }
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                mode="outlined"
                placeholder="Confirm password"
                theme={theme}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.secondary}
                secureTextEntry={!showConfirmPassword}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    color={theme.colors.secondary}
                  />
                }
              />
            </View>

            {/* Vehicle Information Section */}
            <View style={styles.sectionDivider}>
              <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>
                Vehicle Information
              </Text>
            </View>

            {/* Vehicle Make and Model */}
            <View style={styles.nameContainer}>
              <View style={[styles.nameInput, { flex: 1, marginRight: 8 }]}>
                <Ionicons name="car" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
                <TextInput
                  label="Vehicle Make"
                  value={vehicleMake}
                  onChangeText={setVehicleMake}
                  style={styles.input}
                  mode="outlined"
                  placeholder="e.g., Toyota"
                  theme={theme}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.secondary}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.nameInput, { flex: 1, marginLeft: 8 }]}>
                <Ionicons name="car" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
                <TextInput
                  label="Vehicle Model"
                  value={vehicleModel}
                  onChangeText={setVehicleModel}
                  style={styles.input}
                  mode="outlined"
                  placeholder="e.g., Corolla"
                  theme={theme}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.secondary}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Vehicle Year and Color */}
            <View style={styles.nameContainer}>
              <View style={[styles.nameInput, { flex: 1, marginRight: 8 }]}>
                <Ionicons name="calendar" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
                <TextInput
                  label="Vehicle Year"
                  value={vehicleYear}
                  onChangeText={setVehicleYear}
                  style={styles.input}
                  mode="outlined"
                  placeholder="e.g., 2020"
                  theme={theme}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.secondary}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.nameInput, { flex: 1, marginLeft: 8 }]}>
                <Ionicons name="color-palette" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
                <TextInput
                  label="Vehicle Color"
                  value={vehicleColor}
                  onChangeText={setVehicleColor}
                  style={styles.input}
                  mode="outlined"
                  placeholder="e.g., White"
                  theme={theme}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.secondary}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* License Plate Number */}
            <View style={styles.inputContainer}>
              <Ionicons name="card" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
              <TextInput
                label="License Plate Number"
                value={plateNumber}
                onChangeText={setPlateNumber}
                style={styles.input}
                mode="outlined"
                placeholder="e.g., ABC-123"
                theme={theme}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.secondary}
                autoCapitalize="characters"
              />
            </View>

            {/* Driver Information Section */}
            <View style={styles.sectionDivider}>
              <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>
                Driver Information
              </Text>
            </View>

            {/* License Number */}
            <View style={styles.inputContainer}>
              <Ionicons name="id-card" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
              <TextInput
                label="Driver License Number"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                style={styles.input}
                mode="outlined"
                placeholder="Enter license number"
                theme={theme}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.secondary}
                autoCapitalize="characters"
              />
            </View>

            {/* Insurance Number */}
            <View style={styles.inputContainer}>
              <Ionicons name="shield-checkmark" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
              <TextInput
                label="Insurance Number"
                value={insuranceNumber}
                onChangeText={setInsuranceNumber}
                style={styles.input}
                mode="outlined"
                placeholder="Enter insurance number"
                theme={theme}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.secondary}
                autoCapitalize="characters"
              />
            </View>

            {/* Driver Benefits */}
            <View style={styles.benefitsContainer}>
              <Text style={[styles.benefitsTitle, { color: theme.colors.onSurface }]}>
                Driver Benefits:
              </Text>
              <View style={styles.benefitItem}>
                <Ionicons name="cash" size={16} color={theme.colors.secondary} />
                <Text style={[styles.benefitText, { color: theme.colors.onSurfaceVariant }]}>
                  Earn money on your schedule
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="time" size={16} color={theme.colors.secondary} />
                <Text style={[styles.benefitText, { color: theme.colors.onSurfaceVariant }]}>
                  Flexible working hours
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="people" size={16} color={theme.colors.secondary} />
                <Text style={[styles.benefitText, { color: theme.colors.onSurfaceVariant }]}>
                  Meet new people daily
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="star" size={16} color={theme.colors.secondary} />
                <Text style={[styles.benefitText, { color: theme.colors.onSurfaceVariant }]}>
                  Build your reputation
                </Text>
              </View>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <Text style={[styles.termsText, { color: theme.colors.onSurfaceVariant }]}>
                By signing up as a driver, you agree to our{' '}
              </Text>
              <TouchableOpacity>
                <Text style={[styles.termsLink, { color: theme.colors.secondary }]}>
                  Driver Terms
                </Text>
              </TouchableOpacity>
              <Text style={[styles.termsText, { color: theme.colors.onSurfaceVariant }]}>
                {' '}and{' '}
              </Text>
              <TouchableOpacity>
                <Text style={[styles.termsLink, { color: theme.colors.secondary }]}>
                  Privacy Policy
                </Text>
              </TouchableOpacity>
            </View>

            {/* Register Button */}
            <Button
              mode="contained"
              onPress={handleRegister}
              style={[styles.registerButton, { backgroundColor: theme.colors.secondary }]}
              loading={isLoading}
              disabled={isLoading}
              buttonColor={theme.colors.secondary}
              contentStyle={styles.registerButtonContent}
              labelStyle={[styles.registerButtonLabel, { color: '#FFFFFF' }]}
              textColor="#FFFFFF"
            >
              {isLoading ? 'Creating Driver Account...' : 'Create Driver Account'}
            </Button>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: theme.colors.onSurfaceVariant }]}>
                Already have a driver account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.replace('DriverLogin')}>
                <Text style={[styles.loginLink, { color: theme.colors.secondary }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>

            {/* Switch to Rider Registration */}
            <View style={styles.switchContainer}>
              <Text style={[styles.switchText, { color: theme.colors.onSurfaceVariant }]}>
                Want to book rides instead?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.replace('RiderRegister')}>
                <Text style={[styles.switchLink, { color: theme.colors.primary }]}>
                  Rider Registration
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
  sectionDivider: {
    marginTop: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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

export default DriverRegisterScreen;
