import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  private static expoPushToken: string | null = null;

  /**
   * Register for push notifications and get the push token
   */
  static async registerForPushNotificationsAsync(): Promise<string | null> {
    let token: string | null = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('ride-requests', {
        name: 'Ride Requests',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Failed to get push token for push notification!');
        return null;
      }
      
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) {
          console.log('⚠️ Project ID not found - push notifications will be limited to local notifications');
          // Don't throw error, just return null for push token
          return null;
        }
        
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('✅ Push token obtained:', token);
      } catch (error) {
        console.log('⚠️ Error getting push token (will use local notifications only):', error);
        // Don't throw error, just return null for push token
        return null;
      }
    } else {
      console.log('❌ Must use physical device for Push Notifications');
    }

    this.expoPushToken = token;
    return token;
  }

  /**
   * Get the current push token
   */
  static getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Send a local notification
   */
  static async sendLocalNotification(title: string, body: string, data?: any) {
    console.log('🔔 Sending local notification:', { title, body, data });
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
      console.log('✅ Local notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
    }
  }

  /**
   * Send a notification for new ride request
   */
  static async notifyNewRideRequest(rideRequest: {
    id: string;
    riderName: string;
    pickupLocation: string;
    destination: string;
    fare: number;
    distance: string;
  }) {
    console.log('🚗 Notifying new ride request:', rideRequest);
    const title = `🚗 New Ride Request`;
    const body = `${rideRequest.riderName} • ${rideRequest.distance} • PKR ${rideRequest.fare}`;
    
    await this.sendLocalNotification(title, body, {
      type: 'ride_request',
      rideRequestId: rideRequest.id,
      riderName: rideRequest.riderName,
      pickupLocation: rideRequest.pickupLocation,
      destination: rideRequest.destination,
      fare: rideRequest.fare,
    });
  }

  /**
   * Send a notification for fare update
   */
  static async notifyFareUpdate(rideRequest: {
    id: string;
    riderName: string;
    oldFare: number;
    newFare: number;
  }) {
    console.log('💰 Notifying fare update:', rideRequest);
    const title = `💰 Fare Updated`;
    const body = `${rideRequest.riderName} raised fare to PKR ${rideRequest.newFare}`;
    
    await this.sendLocalNotification(title, body, {
      type: 'fare_update',
      rideRequestId: rideRequest.id,
      riderName: rideRequest.riderName,
      oldFare: rideRequest.oldFare,
      newFare: rideRequest.newFare,
    });
  }

  /**
   * Clear all notifications
   */
  static async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Get notification permissions status
   */
  static async getPermissionsStatus() {
    return await Notifications.getPermissionsAsync();
  }

  /**
   * Request notification permissions
   */
  static async requestPermissions() {
    return await Notifications.requestPermissionsAsync();
  }
}

export default NotificationService;
