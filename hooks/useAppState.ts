import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Hook to track app state (active, background, inactive).
 * Useful for handling timer synchronization when app returns from background.
 *
 * @param onForeground - Optional callback fired when app returns to foreground
 * @param onBackground - Optional callback fired when app goes to background
 * @returns Current app state and boolean helpers
 */
export function useAppState(
  onForeground?: () => void,
  onBackground?: () => void
) {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const previousStateRef = useRef<AppStateStatus>(AppState.currentState);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    const previousState = previousStateRef.current;

    // Detect transition from background/inactive to active (foreground)
    if (
      (previousState === 'background' || previousState === 'inactive') &&
      nextAppState === 'active'
    ) {
      onForeground?.();
    }

    // Detect transition from active to background
    if (previousState === 'active' && nextAppState === 'background') {
      onBackground?.();
    }

    previousStateRef.current = nextAppState;
    setAppState(nextAppState);
  }, [onForeground, onBackground]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  return {
    appState,
    isActive: appState === 'active',
    isBackground: appState === 'background',
    isInactive: appState === 'inactive',
  };
}

export default useAppState;
