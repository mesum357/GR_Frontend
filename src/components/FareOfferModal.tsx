import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Text } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

interface FareOfferModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void; // New callback for when 30s timer completes
  fareAmount: number;
  arrivalTime: number;
}

const FareOfferModal: React.FC<FareOfferModalProps> = React.memo(({
  visible,
  onClose,
  onComplete,
  fareAmount,
  arrivalTime,
}) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      console.log('🔧 FareOfferModal: Modal opened, starting timer');
      
      // Reset time
      setTimeLeft(15);

      // Clear any existing timers
      if (timerRef.current) clearTimeout(timerRef.current);
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);

      // Update time left every second
      timeIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          console.log('🔧 Time left:', newTime);
          if (newTime <= 0) {
            console.log('🔧 Time up, calling onComplete');
            // Clear the interval to prevent multiple calls
            if (timeIntervalRef.current) {
              clearInterval(timeIntervalRef.current);
              timeIntervalRef.current = null;
            }
            onComplete();
            return 0;
          }
          return newTime;
        });
      }, 1000);

      // Auto-close after 15 seconds
      timerRef.current = setTimeout(() => {
        console.log('🔧 15 second timer completed, calling onComplete');
        // Clear the timer to prevent multiple calls
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        onComplete();
      }, 15000);

      return () => {
        console.log('🔧 FareOfferModal: Cleaning up timers');
        if (timerRef.current) clearTimeout(timerRef.current);
        if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
      };
    } else {
      // Modal is not visible, clean up timers
      if (timerRef.current) clearTimeout(timerRef.current);
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    }
  }, [visible]); // Remove onComplete from dependencies to prevent timer reset

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Offering your fare</Text>
          <Text style={styles.fareAmount}>PKR {fareAmount}</Text>
          <Text style={styles.arrivalTime}>Arriving in {arrivalTime} minutes</Text>
          
          {/* Countdown Timer */}
          <View style={styles.timerContainer}>
            <Text style={styles.timeLeftText}>{timeLeft}s remaining</Text>
          </View>
          
          <Text style={styles.waitText}>Wait for the reply</Text>
          <Text style={styles.returnText}>Returning to ride details in {timeLeft}s</Text>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#2C2C2C',
    borderRadius: 16,
    paddingHorizontal: 30,
    paddingVertical: 25,
    alignItems: 'center',
    minWidth: width * 0.8,
    maxWidth: width * 0.9,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 8,
  },
  arrivalTime: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 15,
  },
  waitText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  returnText: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  timerContainer: {
    marginVertical: 20,
    alignItems: 'center',
    width: '100%',
  },
  timeLeftText: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 8,
    fontWeight: '600',
  },
});

export default FareOfferModal;
