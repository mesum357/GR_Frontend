import io, { Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface FareOfferMessage {
  rideRequestId: string;
  driverId: string;
  driverName: string;
  driverRating: number;
  fareAmount: number;
  arrivalTime: number;
  vehicleInfo: string;
}

export interface FareResponseMessage {
  rideRequestId: string;
  riderId: string;
  action: 'accept' | 'decline';
  timestamp: number;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pendingAuth: { userId: string; userType: 'rider' | 'driver' } | null = null; // Start with 1 second

  // Event listeners
  private eventListeners: Map<string, Array<(data: any) => void>> = new Map();

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      this.socket = io('https://backend-gr-x2ki.onrender.com', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
      });

      this.socket.on('connect', () => {
        console.log('🔌 WebSocket connected:', this.socket?.id);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.emit('connected', { socketId: this.socket?.id });
        console.log('🔌 WebSocket connection established successfully');
        
        // Handle pending authentication
        if (this.pendingAuth) {
          console.log('🔐 Processing pending authentication:', this.pendingAuth);
          this.socket.emit('authenticate', this.pendingAuth);
          console.log(`🔐 Authenticated as ${this.pendingAuth.userType}:`, this.pendingAuth.userId);
          this.pendingAuth = null;
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
        this.isConnected = false;
        this.emit('disconnected', { reason });
        this.handleReconnect();
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔌 WebSocket connection error:', error);
        this.emit('error', { error: error.message });
        this.handleReconnect();
      });

      // Handle fare offer from driver
      this.socket.on('fare_offer', (data: FareOfferMessage) => {
        console.log('💰 Received fare offer:', data);
        this.emit('fare_offer', data);
      });

      // Handle rider response to fare offer
      this.socket.on('fare_response', (data: FareResponseMessage) => {
        console.log('💰 Received fare response:', data);
        this.emit('fare_response', data);
      });

      // Handle ride request cancellation
      this.socket.on('ride_cancelled', (data: any) => {
        console.log('❌ WebSocket received ride_cancelled:', data);
        this.emit('ride_cancelled', data);
      });

      // Handle driver assignment
      this.socket.on('driver_assigned', (data: any) => {
        console.log('🚗 Driver assigned:', data);
        this.emit('driver_assigned', data);
      });

      // Notify drivers about new ride requests pushed from backend
      this.socket.on('ride_request', (data: any) => {
        console.log('🆕 New ride_request received:', data);
        this.emit('ride_request', data);
      });

      // Handle ride request status updates
      this.socket.on('ride_request_status_update', (data: any) => {
        console.log('📊 Ride request status update:', data);
        this.emit('ride_request_status_update', data);
      });

      // Notify drivers when a ride request was cancelled via REST flow
      this.socket.on('ride_request_cancelled', (data: any) => {
        console.log('❌ ride_request_cancelled received:', data);
        this.emit('ride_request_cancelled', data);
      });

      // Handle fare offer from driver
      this.socket.on('fare_offer', (data: any) => {
        console.log('💰 Received fare offer:', data);
        this.emit('fare_offer', data);
      });

      // Handle fare offer timeout
      this.socket.on('fare_offer_timeout', (data: any) => {
        console.log('⏰ Fare offer timeout:', data);
        this.emit('fare_offer_timeout', data);
      });

      // Handle fare response timeout (for drivers)
      this.socket.on('fare_response_timeout', (data: any) => {
        console.log('⏰ Fare response timeout:', data);
        this.emit('fare_response_timeout', data);
      });

    } catch (error) {
      console.error('🔌 Failed to initialize WebSocket:', error);
      this.emit('error', { error: 'Failed to initialize WebSocket' });
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔌 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (!this.isConnected) {
          this.connect();
        }
      }, delay);
    } else {
      console.error('🔌 Max reconnection attempts reached');
      this.emit('error', { error: 'Max reconnection attempts reached' });
    }
  }

  // Authenticate user
  authenticate(userId: string, userType: 'rider' | 'driver') {
    if (this.socket && this.isConnected) {
      this.socket.emit('authenticate', { userId, userType });
      console.log(`🔐 Authenticated as ${userType}:`, userId);
      console.log(`🔐 WebSocket connection status:`, { isConnected: this.isConnected, socketId: this.socket?.id });
    } else {
      // Don't show warning if we're still connecting
      if (this.socket && !this.isConnected) {
        console.log('🔐 WebSocket connecting, will authenticate when ready');
        // Store authentication data to retry when connected
        this.pendingAuth = { userId, userType };
      } else {
        console.warn('🔐 Cannot authenticate: WebSocket not available', { 
          hasSocket: !!this.socket, 
          isConnected: this.isConnected 
        });
      }
    }
  }

  // Send fare offer to rider
  sendFareOffer(rideRequestId: string, driverId: string, offerData: Omit<FareOfferMessage, 'rideRequestId' | 'driverId'>) {
    if (this.socket && this.isConnected) {
      const message: FareOfferMessage = {
        rideRequestId,
        driverId,
        ...offerData,
      };
      this.socket.emit('fare_offer', message);
      console.log('💰 Sent fare offer:', message);
    } else {
      console.warn('💰 Cannot send fare offer: WebSocket not connected');
    }
  }

  // Send rider response to fare offer
  sendFareResponse(rideRequestId: string, riderId: string, action: 'accept' | 'decline') {
    if (this.socket && this.isConnected) {
      const message: FareResponseMessage = {
        rideRequestId,
        riderId,
        action,
        timestamp: Date.now(),
      };
      this.socket.emit('fare_response', message);
      console.log('💰 Sent fare response:', message);
    } else {
      console.warn('💰 Cannot send fare response: WebSocket not connected');
    }
  }

  // Send driver response to ride request
  sendDriverResponse(rideRequestId: string, driverId: string, action: 'accept' | 'negotiate', counterOffer?: number) {
    if (this.socket && this.isConnected) {
      this.socket.emit('driver_response', {
        rideRequestId,
        driverId,
        action,
        counterOffer,
      });
      console.log('🚗 Sent driver response:', { rideRequestId, driverId, action, counterOffer });
    } else {
      console.warn('🚗 Cannot send driver response: WebSocket not connected');
    }
  }

  // Send ride cancellation event
  sendRideCancellation(rideRequestId: string, userId: string, userType: 'rider' | 'driver') {
    if (this.socket && this.isConnected) {
      this.socket.emit('ride_cancelled', {
        rideRequestId,
        userId,
        userType,
        timestamp: Date.now()
      });
      console.log('🚫 Sent ride cancellation:', { rideRequestId, userId, userType });
    } else {
      console.warn('🚫 Cannot send ride cancellation: WebSocket not connected');
    }
  }

  // Event listener management
  on(event: string, callback: (data: any) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback?: (data: any) => void) {
    if (callback) {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      this.eventListeners.delete(event);
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`🔌 Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
      console.log('🔌 WebSocket disconnected manually');
    }
  }

  // Reconnect manually
  reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
