# Real-time Communication System Test Guide

## Overview
This document outlines the testing procedures for the real-time communication system between riders and drivers for fare offers.

## System Components

### 1. WebSocket Service (`src/services/WebSocketService.ts`)
- **Purpose**: Handles real-time communication between rider and driver
- **Key Features**:
  - Automatic reconnection with exponential backoff
  - Event listener management
  - Fare offer and response handling
  - Connection status monitoring

### 2. FareOfferModal (`src/components/FareOfferModal.tsx`)
- **Purpose**: Shows driver's "Wait for Reply" modal with 30-second countdown
- **Key Features**:
  - Fixed timer reset issues using useRef
  - Proper cleanup of timers and intervals
  - Progress bar visualization
  - Automatic timeout handling

### 3. RiderOfferModal (`src/components/RiderOfferModal.tsx`)
- **Purpose**: Shows driver's offer to rider with accept/decline options
- **Key Features**:
  - 30-second countdown timer
  - Accept/Decline buttons
  - Progress bar visualization
  - Timeout handling

### 4. Backend WebSocket Handlers (`backend/server.js`)
- **Purpose**: Server-side WebSocket event handling
- **Key Features**:
  - `fare_offer` event handling
  - `fare_response` event handling
  - Real-time notifications to both parties
  - Database updates for offer status

## Test Scenarios

### Scenario 1: Driver Accepts Ride Request
1. **Setup**: Driver is on ride requests screen
2. **Action**: Driver taps "Accept" on a ride request
3. **Expected Result**:
   - FareOfferModal appears with 30-second countdown
   - Timer counts down properly without resetting
   - Modal shows "Wait for Reply" message
   - Progress bar fills up over 30 seconds

### Scenario 2: Driver Offers Fare
1. **Setup**: Driver is on ride requests screen
2. **Action**: Driver taps "Offer Fare" and enters amount
3. **Expected Result**:
   - FareOfferModal appears with 30-second countdown
   - WebSocket sends fare offer to rider
   - Timer counts down properly
   - Modal closes after 30 seconds if no response

### Scenario 3: Rider Receives Driver Offer
1. **Setup**: Rider is on finding drivers screen
2. **Action**: Driver sends fare offer
3. **Expected Result**:
   - RiderOfferModal appears on rider's screen
   - Shows driver name, rating, fare amount, arrival time
   - 30-second countdown timer starts
   - Accept/Decline buttons are functional

### Scenario 4: Rider Accepts Offer
1. **Setup**: RiderOfferModal is visible
2. **Action**: Rider taps "Accept"
3. **Expected Result**:
   - WebSocket sends acceptance to driver
   - Both modals close
   - Driver's FareOfferModal closes
   - Rider's FindingDriversModal closes
   - Success message shown to rider

### Scenario 5: Rider Declines Offer
1. **Setup**: RiderOfferModal is visible
2. **Action**: Rider taps "Decline"
3. **Expected Result**:
   - WebSocket sends decline to driver
   - RiderOfferModal closes
   - Driver's FareOfferModal closes
   - Rider continues searching for drivers

### Scenario 6: Timeout Handling
1. **Setup**: Either modal is visible
2. **Action**: Wait for 30 seconds without user interaction
3. **Expected Result**:
   - Modal closes automatically
   - Driver returns to ride requests screen
   - Rider continues searching for drivers
   - No memory leaks from timers

## Technical Validation

### Timer Management
- ✅ No timer reset issues
- ✅ Proper cleanup on component unmount
- ✅ No memory leaks
- ✅ Accurate 30-second countdown

### WebSocket Communication
- ✅ Real-time message delivery
- ✅ Proper authentication
- ✅ Error handling and reconnection
- ✅ Event listener cleanup

### Modal Management
- ✅ Proper modal state management
- ✅ No multiple timer instances
- ✅ Clean transitions between states
- ✅ Edge case handling (app backgrounding, network issues)

### User Experience
- ✅ Clear visual feedback
- ✅ Smooth animations
- ✅ Intuitive button labels
- ✅ Proper loading states

## Error Handling

### Network Disconnection
- WebSocket service automatically attempts reconnection
- Exponential backoff prevents server overload
- User is notified of connection status

### Modal Edge Cases
- App backgrounding: Timers continue running
- Network issues: Graceful degradation
- Multiple offers: Latest offer takes precedence

### Database Consistency
- Atomic updates for offer status
- Proper rollback on errors
- Consistent state across all clients

## Performance Considerations

### Memory Management
- All timers and intervals are properly cleaned up
- Event listeners are removed on component unmount
- No memory leaks from WebSocket connections

### Real-time Performance
- WebSocket messages are delivered instantly
- UI updates are smooth and responsive
- No blocking operations on main thread

## Monitoring and Debugging

### Console Logs
- All major events are logged with emojis for easy identification
- WebSocket connection status is tracked
- Timer operations are logged for debugging

### Error Tracking
- WebSocket errors are caught and logged
- Timer errors are handled gracefully
- User-friendly error messages are displayed

## Success Criteria

✅ Timer counts down properly without resetting
✅ Modal closes after exactly 30 seconds
✅ Rider sees driver's offer in real-time
✅ Both modals close when rider accepts/declines
✅ System handles all edge cases gracefully
✅ No memory leaks from timers or intervals
✅ Real-time communication works reliably
✅ Proper error handling and recovery
✅ Smooth user experience across all scenarios

## Next Steps

1. **Integration Testing**: Test the complete flow with real devices
2. **Load Testing**: Test with multiple concurrent users
3. **Network Testing**: Test with poor network conditions
4. **User Acceptance Testing**: Get feedback from actual users
5. **Performance Optimization**: Monitor and optimize as needed

