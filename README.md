# Gilgit Ride Negotiate - React Native Mobile App

A ride-sharing mobile application built with React Native and Expo, designed for the Gilgit region. This app allows drivers and riders to connect, negotiate fares, and complete rides.

## Features

### For Drivers
- **Dashboard**: View earnings, ratings, and ride statistics
- **Online/Offline Toggle**: Control availability for ride requests
- **Ride Requests**: Accept or counter-offer on ride requests
- **Earnings Tracking**: Monitor daily and total earnings
- **Profile Management**: Update personal and vehicle information

### For Riders
- **Book Rides**: Select pickup and destination locations
- **Driver Selection**: Choose from available drivers with ratings
- **Fare Negotiation**: View and accept driver offers
- **Ride History**: Track past rides and payments
- **Wallet Management**: Top-up and manage payment methods

### General Features
- **Real-time Maps**: Integration with React Native Maps
- **Push Notifications**: Stay updated on ride status
- **Secure Payments**: Multiple payment method support
- **User Ratings**: Rate drivers and riders
- **Profile Management**: Complete user profile system

## Tech Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and build tools
- **TypeScript**: Type-safe JavaScript
- **React Navigation**: Navigation between screens
- **React Native Paper**: Material Design components
- **React Query**: Data fetching and caching
- **React Hook Form**: Form management
- **React Native Toast Message**: User notifications

## Prerequisites

Before running this app, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **Expo Go** app on your mobile device (for testing)

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Run on device/simulator**:
   - **iOS**: Press `i` in the terminal or scan QR code with Expo Go
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go
   - **Web**: Press `w` in the terminal

## Project Structure

```
src/
├── screens/           # Main screen components
│   ├── DriverScreen.tsx
│   ├── RiderScreen.tsx
│   ├── WalletScreen.tsx
│   └── ProfileScreen.tsx

assets/               # Images, icons, and other assets
├── icon.png
├── splash.png
├── adaptive-icon.png
└── favicon.png
```

## Quick Start

1. **Install Expo CLI** (if not already installed):
   ```bash
   npm install -g @expo/cli
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the app**:
   ```bash
   npm start
   ```

4. **Test on your phone**:
   - Install "Expo Go" app from App Store/Google Play
   - Scan the QR code that appears in the terminal
   - Your app will load on your phone!

## Building for Production

### Android APK
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

### Web Build
```bash
expo build:web
```

## Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow React Native best practices
- Use functional components with hooks
- Implement proper error handling
- Add proper TypeScript types

### Component Structure
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ComponentProps {
  // Define props here
}

export default function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Component logic here
  
  return (
    <View style={styles.container}>
      {/* JSX here */}
    </View>
  );
}

const styles = StyleSheet.create({
  // Styles here
});
```

## Next Steps

1. **Add Real Backend**: Connect to actual API endpoints
2. **Implement Maps**: Add Google Maps API keys
3. **Push Notifications**: Configure Firebase/Expo notifications
4. **Payment Integration**: Add payment gateway integration
5. **Testing**: Add unit and integration tests
6. **App Store Deployment**: Prepare for app store submission

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## License

This project is licensed under the MIT License.
