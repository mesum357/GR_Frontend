import React from 'react';
import ModeAwareScreen from './ModeAwareScreen';
import DriverNavigator from '../navigation/DriverNavigator';

const DriverModeWrapper: React.FC = () => {
  return (
    <ModeAwareScreen 
      allowedModes={['driver']}
      redirectTo="Home"
      fallbackMessage="Switch to Driver Mode to access the driver dashboard"
    >
      <DriverNavigator />
    </ModeAwareScreen>
  );
};

export default DriverModeWrapper;
