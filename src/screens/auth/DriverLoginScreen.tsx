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

interface DriverLoginScreenProps {
  navigation: any;
  onLogin: (token: string, user: any) => void;
}

const DriverLoginScreen: React.FC<DriverLoginScreenProps> = ({ navigation, onLogin }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    console.log('🚀 Starting driver login process...');
    try {
      const data = await apiRequest(API_ENDPOINTS.auth.login, {
        method: 'POST',
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
          expectedUserType: 'driver', // Specify expected user type
        }),
      });

      // Verify user is actually a driver
      if (data.user.userType !== 'driver') {
        Alert.alert(
          'Wrong Account Type', 
          'This account is registered as a rider. Please use Rider Login instead.',
          [
            { text: 'OK' },
            { 
              text: 'Go to Rider Login', 
              onPress: () => navigation.replace('RiderLogin')
            }
          ]
        );
        return;
      }

      onLogin(data.token, data.user);
    } catch (error: any) {
      console.error('Driver login error:', error);
      
      // Handle specific error messages
      let errorMessage = 'Network error. Please try again.';
      
      // Handle timeout errors specifically
      if (error.message.includes('timeout')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again. If the problem persists, the backend server may be down.';
      }
      
      if (error?.message) {
        if (error.message.includes('registered as a rider') || error.message.includes('Rider Login')) {
          Alert.alert(
            'Wrong Account Type', 
            'This account is registered as a rider. Please use Rider Login instead.',
            [
              { text: 'OK' },
              { 
                text: 'Go to Rider Login', 
                onPress: () => navigation.replace('RiderLogin')
              }
            ]
          );
          return;
        } else if (error.message.includes('Invalid credentials') || error.message.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Login Failed', errorMessage);
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
              <Ionicons name="car" size={48} color="white" />
            </View>
            <Text style={styles.appTitle}>Driver Login</Text>
            <Text style={styles.appSubtitle}>Start earning by giving rides</Text>
          </View>
        </View>

        {/* Login Form */}
        <Card style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.formTitle, { color: theme.colors.onSurface }]}>
              Welcome Back, Driver!
            </Title>
            <Text style={[styles.formSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Sign in to start earning with rides
            </Text>

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

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                mode="outlined"
                placeholder="Enter your password"
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

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: theme.colors.secondary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              mode="contained"
              onPress={handleLogin}
              style={[styles.loginButton, { backgroundColor: theme.colors.secondary }]}
              loading={isLoading}
              disabled={isLoading}
              buttonColor={theme.colors.secondary}
              contentStyle={styles.loginButtonContent}
              labelStyle={[styles.loginButtonLabel, { color: '#FFFFFF' }]}
              textColor="#FFFFFF"
            >
              {isLoading ? 'Signing In...' : 'Sign In as Driver'}
            </Button>

            {/* Info Box */}
            <View style={[styles.infoBox, { backgroundColor: `${theme.colors.secondary}10` }]}>
              <Ionicons name="information-circle" size={20} color={theme.colors.secondary} />
              <Text style={[styles.infoText, { color: theme.colors.secondary }]}>
                This login is for drivers only. If you're a rider, please use Rider Login.
              </Text>
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
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              <Text style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>
                OR
              </Text>
              <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            </View>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={[styles.registerText, { color: theme.colors.onSurfaceVariant }]}>
                Don't have a driver account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('DriverRegister')}>
                <Text style={[styles.registerLink, { color: theme.colors.secondary }]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Switch to Rider Login */}
            <View style={styles.switchContainer}>
              <Text style={[styles.switchText, { color: theme.colors.onSurfaceVariant }]}>
                Are you a rider?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.replace('RiderLogin')}>
                <Text style={[styles.switchLink, { color: theme.colors.primary }]}>
                  Rider Login
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
    marginBottom: 32,
    textAlign: 'center',
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: 12,
    elevation: 2,
    marginBottom: 24,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  registerText: {
    fontSize: 16,
  },
  registerLink: {
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

export default DriverLoginScreen;
