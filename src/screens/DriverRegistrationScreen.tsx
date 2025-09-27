import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, Checkbox } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl } from '../config/api';

const DriverRegistrationScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Vehicle Information
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    plateNumber: '',
    vehicleType: 'car',

    // License Information
    licenseNumber: '',
    licenseExpiry: '',

    // Insurance Information
    insuranceNumber: '',
    insuranceExpiry: '',

    // Bank Information
    accountNumber: '',
    bankName: '',
    accountHolderName: '',

    // Preferences
    preferredAreas: ['Gilgit City'],
    maxDistance: '50',
    minFare: '50',
    maxFare: '2000',

    // Working Hours
    startTime: '06:00',
    endTime: '22:00',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  });

  const [selectedVehicleType, setSelectedVehicleType] = useState('car');
  const [selectedWorkingDays, setSelectedWorkingDays] = useState([
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ]);

  const vehicleTypes = [
    { value: 'car', label: 'Car', icon: 'car' },
    { value: 'motorcycle', label: 'Motorcycle', icon: 'bicycle' },
    { value: 'suv', label: 'SUV', icon: 'car-sport' },
    { value: 'van', label: 'Van', icon: 'car' },
  ];

  const workingDays = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' },
  ];

  const handleWorkingDayToggle = (day) => {
    setSelectedWorkingDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.vehicleMake || !formData.vehicleModel || !formData.vehicleYear || 
        !formData.vehicleColor || !formData.plateNumber || !formData.licenseNumber || 
        !formData.licenseExpiry || !formData.insuranceNumber || !formData.insuranceExpiry) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (selectedWorkingDays.length === 0) {
      Alert.alert('Error', 'Please select at least one working day');
      return;
    }

    setIsLoading(true);

    try {
      const driverData = {
        vehicleInfo: {
          make: formData.vehicleMake,
          model: formData.vehicleModel,
          year: parseInt(formData.vehicleYear),
          color: formData.vehicleColor,
          plateNumber: formData.plateNumber,
          vehicleType: selectedVehicleType,
        },
        licenseNumber: formData.licenseNumber,
        licenseExpiry: formData.licenseExpiry,
        insuranceNumber: formData.insuranceNumber,
        insuranceExpiry: formData.insuranceExpiry,
        bankInfo: {
          accountNumber: formData.accountNumber,
          bankName: formData.bankName,
          accountHolderName: formData.accountHolderName,
        },
        preferredAreas: formData.preferredAreas,
        maxDistance: parseInt(formData.maxDistance),
        minFare: parseInt(formData.minFare),
        maxFare: parseInt(formData.maxFare),
        workingHours: {
          startTime: formData.startTime,
          endTime: formData.endTime,
          workingDays: selectedWorkingDays,
        },
      };

      const response = await fetch(buildApiUrl('/api/drivers/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(driverData),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          'Driver registration successful! Your application will be reviewed.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to register as driver');
      }
    } catch (error) {
      console.error('Error registering as driver:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 120 + insets.bottom : 120,
        }}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.headerTitle}>Driver Registration</Text>
          <Text style={styles.headerSubtitle}>
            Complete your profile to start driving
          </Text>
        </View>

        {/* Vehicle Information */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Vehicle Information
            </Title>

            <View style={styles.vehicleTypeContainer}>
              <Text style={[styles.sectionLabel, { color: theme.colors.onSurface }]}>
                Vehicle Type
              </Text>
              <View style={styles.vehicleTypeButtons}>
                {vehicleTypes.map((type) => (
                  <Button
                    key={type.value}
                    mode={selectedVehicleType === type.value ? 'contained' : 'outlined'}
                    onPress={() => setSelectedVehicleType(type.value)}
                    style={styles.vehicleTypeButton}
                    icon={type.icon}
                  >
                    {type.label}
                  </Button>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <TextInput
                label="Vehicle Make *"
                value={formData.vehicleMake}
                onChangeText={(text) => setFormData({ ...formData, vehicleMake: text })}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                theme={theme}
              />
              <TextInput
                label="Vehicle Model *"
                value={formData.vehicleModel}
                onChangeText={(text) => setFormData({ ...formData, vehicleModel: text })}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                theme={theme}
              />
            </View>

            <View style={styles.row}>
              <TextInput
                label="Year *"
                value={formData.vehicleYear}
                onChangeText={(text) => setFormData({ ...formData, vehicleYear: text })}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                keyboardType="numeric"
                theme={theme}
              />
              <TextInput
                label="Color *"
                value={formData.vehicleColor}
                onChangeText={(text) => setFormData({ ...formData, vehicleColor: text })}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                theme={theme}
              />
            </View>

            <TextInput
              label="License Plate Number *"
              value={formData.plateNumber}
              onChangeText={(text) => setFormData({ ...formData, plateNumber: text })}
              style={styles.input}
              mode="outlined"
              theme={theme}
            />
          </Card.Content>
        </Card>

        {/* License & Insurance */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              License & Insurance
            </Title>

            <TextInput
              label="License Number *"
              value={formData.licenseNumber}
              onChangeText={(text) => setFormData({ ...formData, licenseNumber: text })}
              style={styles.input}
              mode="outlined"
              theme={theme}
            />

            <TextInput
              label="License Expiry Date *"
              value={formData.licenseExpiry}
              onChangeText={(text) => setFormData({ ...formData, licenseExpiry: text })}
              style={styles.input}
              mode="outlined"
              placeholder="YYYY-MM-DD"
              theme={theme}
            />

            <TextInput
              label="Insurance Number *"
              value={formData.insuranceNumber}
              onChangeText={(text) => setFormData({ ...formData, insuranceNumber: text })}
              style={styles.input}
              mode="outlined"
              theme={theme}
            />

            <TextInput
              label="Insurance Expiry Date *"
              value={formData.insuranceExpiry}
              onChangeText={(text) => setFormData({ ...formData, insuranceExpiry: text })}
              style={styles.input}
              mode="outlined"
              placeholder="YYYY-MM-DD"
              theme={theme}
            />
          </Card.Content>
        </Card>

        {/* Bank Information */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Bank Information (Optional)
            </Title>

            <TextInput
              label="Account Number"
              value={formData.accountNumber}
              onChangeText={(text) => setFormData({ ...formData, accountNumber: text })}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              theme={theme}
            />

            <TextInput
              label="Bank Name"
              value={formData.bankName}
              onChangeText={(text) => setFormData({ ...formData, bankName: text })}
              style={styles.input}
              mode="outlined"
              theme={theme}
            />

            <TextInput
              label="Account Holder Name"
              value={formData.accountHolderName}
              onChangeText={(text) => setFormData({ ...formData, accountHolderName: text })}
              style={styles.input}
              mode="outlined"
              theme={theme}
            />
          </Card.Content>
        </Card>

        {/* Working Schedule */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Working Schedule
            </Title>

            <Text style={[styles.sectionLabel, { color: theme.colors.onSurface }]}>
              Working Days *
            </Text>
            <View style={styles.workingDaysContainer}>
              {workingDays.map((day) => (
                <Button
                  key={day.value}
                  mode={selectedWorkingDays.includes(day.value) ? 'contained' : 'outlined'}
                  onPress={() => handleWorkingDayToggle(day.value)}
                  style={styles.workingDayButton}
                  compact
                >
                  {day.label}
                </Button>
              ))}
            </View>

            <View style={styles.row}>
              <TextInput
                label="Start Time"
                value={formData.startTime}
                onChangeText={(text) => setFormData({ ...formData, startTime: text })}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                theme={theme}
              />
              <TextInput
                label="End Time"
                value={formData.endTime}
                onChangeText={(text) => setFormData({ ...formData, endTime: text })}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                theme={theme}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Preferences */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Preferences
            </Title>

            <View style={styles.row}>
              <TextInput
                label="Max Distance (km)"
                value={formData.maxDistance}
                onChangeText={(text) => setFormData({ ...formData, maxDistance: text })}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                keyboardType="numeric"
                theme={theme}
              />
              <TextInput
                label="Min Fare (PKR)"
                value={formData.minFare}
                onChangeText={(text) => setFormData({ ...formData, minFare: text })}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                keyboardType="numeric"
                theme={theme}
              />
            </View>

            <TextInput
              label="Max Fare (PKR)"
              value={formData.maxFare}
              onChangeText={(text) => setFormData({ ...formData, maxFare: text })}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              theme={theme}
            />
          </Card.Content>
        </Card>

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
          loading={isLoading}
          disabled={isLoading}
          buttonColor={theme.colors.primary}
          contentStyle={styles.submitButtonContent}
          labelStyle={[styles.submitButtonLabel, { color: '#FFFFFF' }]}
          textColor="#FFFFFF"
        >
          {isLoading ? 'Registering...' : 'Register as Driver'}
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  card: {
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vehicleTypeContainer: {
    marginBottom: 20,
  },
  vehicleTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleTypeButton: {
    marginBottom: 8,
  },
  workingDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  workingDayButton: {
    marginBottom: 8,
  },
  submitButton: {
    margin: 20,
    borderRadius: 12,
    elevation: 2,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DriverRegistrationScreen;
