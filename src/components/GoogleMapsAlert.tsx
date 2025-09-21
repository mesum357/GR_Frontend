import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';

let billingAlertShown = false;

export const showGoogleMapsBillingAlert = () => {
  if (!billingAlertShown) {
    billingAlertShown = true;
    Alert.alert(
      'Google Maps Setup Required',
      'To use location features:\n\n1. Enable billing in Google Cloud Console\n2. Visit: console.cloud.google.com/billing\n3. Add a payment method\n\nFor now, coordinates will be shown instead of addresses.',
      [{ text: 'OK' }]
    );
  }
};

export const resetBillingAlert = () => {
  billingAlertShown = false;
};
