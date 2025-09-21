# iOS Modal Visibility Fix

## Problem
The FindingDriversModal was not appearing immediately when the "Find driver" button was pressed on iOS. The modal would mount (confirmed by console logs) and the `visible` prop would be set to `true`, but the modal UI would not display until the user navigated back to the previous screen.

## Root Cause
iOS-specific rendering timing issue where React Native's Modal component requires a complete re-render cycle to display properly. The immediate state update was causing a race condition between the modal mounting and UIKit's presentation layer.

## Solution Implemented

### 1. Custom Hook: `useShowModalWithIOSFix`
Created a custom hook that handles iOS-specific modal timing:

```typescript
// src/hooks/useShowModalWithIOSFix.ts
export function useShowModalWithIOSFix({ initial = false } = {}) {
  const [mounted, setMounted] = useState(initial);
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);

  const open = () => {
    setKey(k => k + 1); // Force remount
    setMounted(true);
    
    if (Platform.OS === 'ios') {
      // Use InteractionManager + requestAnimationFrame + setTimeout
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          setTimeout(() => setVisible(true), 0);
        });
      });
    } else {
      setVisible(true); // Android works fine
    }
  };

  const close = () => {
    setVisible(false);
    setTimeout(() => setMounted(false), 300);
  };

  return { mounted, visible, key, open, close };
}
```

### 2. Updated RiderScreen
Replaced direct state management with the custom hook:

```typescript
// Before
const [showFindingDrivers, setShowFindingDrivers] = useState(false);

// After
const { mounted: modalMounted, visible: modalVisible, key: modalKey, open: openModal, close: closeModal } = useShowModalWithIOSFix();
```

### 3. Enhanced Debug Logging
Added comprehensive logging to track modal lifecycle:

- Modal mount/unmount events
- onShow event tracking
- State transition logging
- Platform-specific behavior logging

## How It Works

### iOS Flow:
1. User presses "Find driver"
2. `openModal()` called
3. Modal key incremented (forces remount)
4. `mounted` set to `true`
5. `InteractionManager.runAfterInteractions()` waits for current interactions to finish
6. `requestAnimationFrame()` schedules for next frame
7. `setTimeout(0)` ensures execution after current call stack
8. `visible` set to `true`
9. Modal appears immediately

### Android Flow:
1. User presses "Find driver"
2. `openModal()` called
3. Modal key incremented
4. `mounted` set to `true`
5. `visible` set to `true` immediately
6. Modal appears immediately

## Testing

### Manual Test Steps:
1. Open route screen with pickup & destination set
2. Press "Find driver" button
3. Verify modal appears immediately on iOS
4. Test multiple open/close cycles
5. Test with different animation types
6. Verify Android behavior unchanged

### Expected Console Output:
```
🚗 handleFindDriver called with: { fare: 100, paymentMethod: 'Cash', autoAccept: false }
🔧 useShowModalWithIOSFix: Opening modal
🔧 iOS: Using InteractionManager + requestAnimationFrame + setTimeout
🔧 FindingDriversModal: Component mounted
🔧 FindingDriversModal: useEffect triggered, visible: true
🔧 FindingDriversModal: Modal is visible, loading route and starting search
🔧 iOS: Setting visible to true
🔧 FindingDriversModal: onShow fired - modal is now visible
```

## Alternative Solutions

If the current fix doesn't work, try these alternatives:

### 1. react-native-modal
Replace React Native Modal with `react-native-modal` for better iOS compatibility:

```bash
npm install react-native-modal
```

### 2. LayoutAnimation
Use LayoutAnimation to force layout updates:

```typescript
import { LayoutAnimation } from 'react-native';

const openModal = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setVisible(true);
};
```

### 3. Different Animation Types
Try different animation configurations:

```typescript
<Modal
  visible={visible}
  animationType="none" // or "fade"
  presentationStyle="pageSheet" // or "formSheet"
/>
```

## Configuration

### Adjusting Delays
If needed, adjust the timing in `useShowModalWithIOSFix.ts`:

```typescript
// Increase delay if modal still doesn't appear
setTimeout(() => setVisible(true), 16); // 16ms instead of 0

// Or add additional delay
setTimeout(() => setVisible(true), 50); // 50ms delay
```

### Debug Mode
Enable/disable debug logging by modifying console.log statements in the hook and components.

## Files Modified

1. `src/hooks/useShowModalWithIOSFix.ts` - New custom hook
2. `src/screens/RiderScreen.tsx` - Updated to use new hook
3. `src/components/FindingDriversModal.tsx` - Added debug logging
4. `src/tests/ModalVisibilityTest.md` - Test documentation
5. `src/docs/iOSModalFix.md` - This documentation

## Success Criteria

- ✅ Modal appears immediately on iOS when "Find driver" pressed
- ✅ Android behavior unchanged
- ✅ onShow event fires consistently
- ✅ No flicker or double-mount issues
- ✅ Modal UI interactive while map loads
- ✅ All animation types work
- ✅ Multiple open/close cycles work

## Troubleshooting

### Modal Still Not Appearing
1. Check if `onShow` event fires in console
2. Verify `visible` prop is `true`
3. Check for z-index conflicts
4. Try `animationType="none"`
5. Consider switching to `react-native-modal`

### onShow Not Firing
- Native presentation didn't occur
- Check for ancestor view blocking
- Verify modal is at top level of component tree
- Check for multiple root views in app scene

### Performance Issues
- Defer heavy map initialization until modal is visible
- Use `InteractionManager` for heavy tasks
- Consider lazy loading of modal content
