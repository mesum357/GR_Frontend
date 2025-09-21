import { useState } from 'react';
import { InteractionManager, Platform } from 'react-native';

export function useShowModalWithIOSFix({ initial = false } = {}) {
  const [mounted, setMounted] = useState(initial);
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);

  const open = () => {
    console.log('🔧 useShowModalWithIOSFix: Opening modal');
    setKey(k => k + 1);
    setMounted(true);
    
    // Reset visible state first to ensure it can be set to true again
    setVisible(false);
    
    if (Platform.OS === 'ios') {
      console.log('🔧 iOS: Using InteractionManager + requestAnimationFrame + setTimeout');
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            console.log('🔧 iOS: Setting visible to true');
            setVisible(true);
          }, 0);
        });
      });
    } else {
      console.log('🔧 Android: Setting visible immediately');
      setVisible(true);
    }
  };

  const close = () => {
    console.log('🔧 useShowModalWithIOSFix: Closing modal');
    setVisible(false);
    // Allow animation to finish then unmount
    setTimeout(() => {
      console.log('🔧 useShowModalWithIOSFix: Unmounting modal');
      setMounted(false);
    }, 300);
  };

  return { mounted, visible, key, open, close };
}
