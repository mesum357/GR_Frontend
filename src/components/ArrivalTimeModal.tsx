import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Text } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

interface ArrivalTimeModalProps {
  visible: boolean;
  onClose: () => void;
  onTimeSelected: (minutes: number) => void;
}

const ArrivalTimeModal: React.FC<ArrivalTimeModalProps> = ({
  visible,
  onClose,
  onTimeSelected,
}) => {
  const timeOptions = [5, 10, 15, 20];

  const handleTimeSelect = (minutes: number) => {
    onTimeSelected(minutes);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>How soon will you arrive?</Text>
          
          <View style={styles.timeOptions}>
            {timeOptions.map((minutes) => (
              <TouchableOpacity
                key={minutes}
                style={styles.timeButton}
                onPress={() => handleTimeSelect(minutes)}
                activeOpacity={0.8}
              >
                <Text style={styles.timeButtonText}>{minutes} min.</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#2C2C2C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
    minHeight: height * 0.4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
  },
  timeOptions: {
    gap: 15,
    marginBottom: 30,
  },
  timeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  timeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#404040',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ArrivalTimeModal;
