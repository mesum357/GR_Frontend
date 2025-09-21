import React from 'react';
import ModeAwareScreen from './ModeAwareScreen';
import RideNavigator from '../navigation/RideNavigator';

const PassengerHomeWrapper: React.FC = () => {
  return (
    <ModeAwareScreen 
      allowedModes={['passenger']}
      redirectTo="DriverMode"
      fallbackMessage="Switch to Passenger Mode to book rides"
    >
      <RideNavigator />
    </ModeAwareScreen>
  );
};

export default PassengerHomeWrapper;
