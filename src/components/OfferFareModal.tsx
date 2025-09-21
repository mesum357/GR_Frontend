import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
  Keyboard,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { Text, Surface, TextInput, Switch } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface OfferFareModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmFare: (fare: number, paymentMethod: string, autoAccept: boolean) => void;
  vehicleType: 'bike' | 'car' | 'truck';
  distance: number; // in kilometers
  baseFare?: number;
}

const OfferFareModal: React.FC<OfferFareModalProps> = ({
  visible,
  onClose,
  onConfirmFare,
  vehicleType,
  distance,
  baseFare,
}) => {
  const { theme } = useTheme();
  const [fare, setFare] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [autoAccept, setAutoAccept] = useState(false);

  // Calculate minimum fare based on vehicle type and distance
  const getMinimumFare = () => {
    const minPerKm = vehicleType === 'bike' ? 50 : vehicleType === 'car' ? 80 : 100; // trucks
    return Math.ceil(distance * minPerKm);
  };

  const minimumFare = getMinimumFare();
  const currentFare = parseInt(fare) || 0;
  const isFareValid = currentFare >= minimumFare;

  useEffect(() => {
    // Set initial fare to base fare or minimum fare
    if (baseFare && baseFare >= minimumFare) {
      setFare(baseFare.toString());
    } else {
      setFare(minimumFare.toString());
    }
  }, [baseFare, minimumFare]);


  const handleNumberPress = (number: string) => {
    if (number === '.') {
      if (!fare.includes('.')) {
        setFare(prev => prev + '.');
      }
    } else if (number === 'backspace') {
      setFare(prev => prev.slice(0, -1));
    } else {
      setFare(prev => prev + number);
    }
  };

  const handleConfirmFare = () => {
    if (!isFareValid) {
      Alert.alert(
        'Invalid Fare',
        `Minimum fare is PKR ${minimumFare}. Please enter a valid amount.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (currentFare > 0) {
      onConfirmFare(currentFare, paymentMethod, autoAccept);
      onClose();
    } else {
      Alert.alert(
        'Invalid Fare',
        'Please enter a valid fare amount.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePaymentMethodSelect = () => {
    Alert.alert(
      'Payment Method',
      'Select payment method',
      [
        { text: 'Cash', onPress: () => setPaymentMethod('cash') },
        { text: 'Card', onPress: () => setPaymentMethod('card') },
        { text: 'Digital Wallet', onPress: () => setPaymentMethod('wallet') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handlePromoCode = () => {
    Alert.alert('Promo Code', 'Promo code feature coming soon!');
  };

  const renderKeypad = () => (
    <View style={styles.keypad}>
      {/* Row 1 */}
      <View style={styles.keypadRow}>
        <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('1')}>
          <Text style={styles.keyText}>1</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('2')}>
          <Text style={styles.keyText}>2</Text>
          <Text style={styles.keySubText}>ABC</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('3')}>
          <Text style={styles.keyText}>3</Text>
          <Text style={styles.keySubText}>DEF</Text>
        </TouchableOpacity>
      </View>

      {/* Row 2 */}
      <View style={styles.keypadRow}>
        <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('4')}>
          <Text style={styles.keyText}>4</Text>
          <Text style={styles.keySubText}>GHI</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('5')}>
          <Text style={styles.keyText}>5</Text>
          <Text style={styles.keySubText}>JKL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('6')}>
          <Text style={styles.keyText}>6</Text>
          <Text style={styles.keySubText}>MNO</Text>
        </TouchableOpacity>
      </View>

      {/* Row 3 */}
      <View style={styles.keypadRow}>
        <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('7')}>
          <Text style={styles.keyText}>7</Text>
          <Text style={styles.keySubText}>PQRS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('8')}>
          <Text style={styles.keyText}>8</Text>
          <Text style={styles.keySubText}>TUV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('9')}>
          <Text style={styles.keyText}>9</Text>
          <Text style={styles.keySubText}>WXYZ</Text>
        </TouchableOpacity>
      </View>

      {/* Row 4 */}
      <View style={styles.keypadRow}>
        <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('.')}>
          <Text style={styles.keyText}>.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('0')}>
          <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('backspace')}>
          <Ionicons name="backspace-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Offer your fare
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Fare Input Section */}
          <View style={[styles.fareInputSection, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.fareInputContainer}>
              <Text style={[styles.currencyText, { color: theme.colors.onSurface }]}>PKR</Text>
              <TextInput
                value={fare}
                onChangeText={setFare}
                style={[styles.fareInput, { color: theme.colors.onSurface }]}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.outline}
                selectionColor={theme.colors.primary}
                showSoftInputOnFocus={false}
              />
            </View>
            <View style={[styles.separator, { backgroundColor: theme.colors.outline }]} />
            
            {/* Minimum fare warning */}
            {!isFareValid && fare.length > 0 && (
              <Text style={[styles.minimumFareText, { color: '#FF6B6B' }]}>
                Minimum fare is PKR {minimumFare}
              </Text>
            )}
          </View>

          {/* Options */}
          <View style={[styles.optionsSection, { backgroundColor: theme.colors.surface }]}>
            {/* Promo Code */}
            <TouchableOpacity style={styles.optionItem} onPress={handlePromoCode}>
              <View style={styles.optionLeft}>
                <Ionicons name="pricetag-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.optionText, { color: theme.colors.onSurface }]}>
                  Promo code
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.outline} />
            </TouchableOpacity>

            {/* Payment Method */}
            <TouchableOpacity style={styles.optionItem} onPress={handlePaymentMethodSelect}>
              <View style={styles.optionLeft}>
                <Ionicons 
                  name={paymentMethod === 'cash' ? 'cash-outline' : 'card-outline'} 
                  size={20} 
                  color={theme.colors.primary} 
                />
                <Text style={[styles.optionText, { color: theme.colors.onSurface }]}>
                  {paymentMethod}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.outline} />
            </TouchableOpacity>

            {/* Auto Accept */}
            <View style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Ionicons name="paper-plane-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.optionText, { color: theme.colors.onSurface }]}>
                  Automatically accept the nearest driver for PKR {currentFare}
                </Text>
              </View>
              <Switch
                value={autoAccept}
                onValueChange={setAutoAccept}
                color={theme.colors.primary}
              />
            </View>
          </View>

          {/* Done Button */}
          <View style={[styles.buttonContainer, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={[
                styles.doneButton,
                { 
                  backgroundColor: isFareValid ? '#4CAF50' : theme.colors.outline,
                  opacity: isFareValid ? 1 : 0.6,
                }
              ]}
              onPress={handleConfirmFare}
              disabled={!isFareValid}
            >
              <Text style={[styles.doneButtonText, { color: isFareValid ? 'white' : theme.colors.onSurface }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Keypad - Fixed at bottom */}
        <View style={styles.keypadContainer}>
          {renderKeypad()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerTitle: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
  },
  fareInputSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  fareInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currencyText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 8,
  },
  fareInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    padding: 0,
    margin: 0,
  },
  separator: {
    height: 1,
    width: '100%',
  },
  minimumFareText: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  optionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  doneButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  keypadContainer: {
    backgroundColor: '#1C1C1E',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  keypad: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  key: {
    width: (width - 60) / 3,
    height: 50,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '500',
  },
  keySubText: {
    color: 'white',
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },
});

export default OfferFareModal;
