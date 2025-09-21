import React from 'react';
import ModeAwareScreen from './ModeAwareScreen';
import RecentRidesScreen from '../screens/RecentRidesScreen';

const RecentRidesWrapper: React.FC = () => {
  return (
    <ModeAwareScreen 
      allowedModes={['passenger']}
      redirectTo="DriverMode"
      fallbackMessage="Recent rides are only available in Passenger Mode"
    >
      <RecentRidesScreen />
    </ModeAwareScreen>
  );
};

export default RecentRidesWrapper;
