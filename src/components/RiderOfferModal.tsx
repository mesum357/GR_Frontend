import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface RiderOfferModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
  driverName: string;
  driverRating: number;
  fareAmount: number;
  arrivalTime: number;
  vehicleInfo: string;
  onTimeout?: () => void; // Callback when 30s timeout is reached
}

const RiderOfferModal: React.FC<RiderOfferModalProps> = React.memo(({
  visible,
  onClose,
  onAccept,
  onDecline,
  driverName,
  driverRating,
  fareAmount,
  arrivalTime,
  vehicleInfo,
  onTimeout,
}) => {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      console.log('🔧 RiderOfferModal: Modal opened, starting timer');
      
      // Reset progress and time
      setProgress(0);
      setTimeLeft(15);

      // Clear any existing timers
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);

      // Update progress every second
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / 15); // 100% over 15 seconds
          return Math.min(newProgress, 100);
        });
      }, 1000);

      // Update time left every second
      timeIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            console.log('🔧 RiderOfferModal: Time up, calling onTimeout');
            onTimeout?.();
            return 0;
          }
          return newTime;
        });
      }, 1000);

      // Auto-close after 15 seconds
      timerRef.current = setTimeout(() => {
        console.log('🔧 RiderOfferModal: 15 second timer completed, calling onTimeout');
        onTimeout?.();
      }, 15000);

      return () => {
        console.log('🔧 RiderOfferModal: Cleaning up timers');
        if (timerRef.current) clearTimeout(timerRef.current);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
      };
    } else {
      // Modal is not visible, clean up timers
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    }
  }, [visible, onTimeout]);

  const handleAccept = () => {
    console.log('🔧 RiderOfferModal: Accept button pressed');
    onAccept();
  };

  const handleDecline = () => {
    console.log('🔧 RiderOfferModal: Decline button pressed');
    onDecline();
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Driver Offer</Text>
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{timeLeft}s</Text>
            </View>
          </View>

          {/* Driver Info */}
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={30} color="white" />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{driverName}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{driverRating}</Text>
              </View>
              <Text style={styles.vehicleText}>{vehicleInfo}</Text>
            </View>
          </View>

          {/* Offer Details */}
          <View style={styles.offerDetails}>
            <View style={styles.fareContainer}>
              <Text style={styles.fareLabel}>Offered Fare</Text>
              <Text style={styles.fareAmount}>PKR {fareAmount}</Text>
            </View>
            <View style={styles.arrivalContainer}>
              <Ionicons name="time" size={20} color="#4CAF50" />
              <Text style={styles.arrivalText}>Arriving in {arrivalTime} minutes</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View 
                style={[
                  styles.progressBar,
                  { width: `${progress}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={handleDecline}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color="white" />
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>

          {/* Timeout Warning */}
          <Text style={styles.timeoutWarning}>
            This offer will expire in {timeLeft} seconds
          </Text>
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
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingHorizontal: 25,
    paddingVertical: 30,
    alignItems: 'center',
    minWidth: width * 0.85,
    maxWidth: width * 0.9,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 25,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  timerContainer: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  timerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    width: '100%',
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingText: {
    fontSize: 14,
    color: '#FFD700',
    marginLeft: 5,
    fontWeight: '500',
  },
  vehicleText: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  offerDetails: {
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%',
  },
  fareContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  fareLabel: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 5,
  },
  fareAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  arrivalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivalText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 25,
    alignItems: 'center',
  },
  progressBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#333333',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#444444',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#888888',
    marginTop: 8,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
    marginBottom: 15,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  declineButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  timeoutWarning: {
    fontSize: 12,
    color: '#FF5722',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default RiderOfferModal;

