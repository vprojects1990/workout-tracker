import { Platform, ViewStyle } from 'react-native';

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

// iOS-style subtle shadows
// These shadows are designed to be subtle and elegant, matching Apple's design language
export const Shadows = {
  // No shadow
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ShadowStyle,

  // Extra small - subtle depth for small elements
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1,
  } as ShadowStyle,

  // Small - subtle lift for interactive elements
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  } as ShadowStyle,

  // Medium - standard card shadow
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  } as ShadowStyle,

  // Large - elevated elements like modals
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  } as ShadowStyle,

  // Extra large - floating elements
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  } as ShadowStyle,
};

// Semantic shadow aliases
export const ShadowStyles = {
  // Cards
  card: Shadows.small,
  cardElevated: Shadows.medium,
  cardPressed: Shadows.xs,

  // Interactive
  button: Shadows.small,
  buttonPressed: Shadows.xs,

  // Navigation
  header: Shadows.small,
  tabBar: {
    ...Shadows.small,
    shadowOffset: { width: 0, height: -1 },
  } as ShadowStyle,

  // Overlays
  modal: Shadows.xl,
  dropdown: Shadows.medium,
  tooltip: Shadows.medium,
  popover: Shadows.large,

  // Input
  inputFocused: Shadows.small,
};

// Helper to apply shadow conditionally based on theme
// In dark mode, shadows are less visible, so we can optionally reduce opacity
export function getShadow(
  shadow: ShadowStyle,
  isDarkMode: boolean = false
): ShadowStyle {
  if (isDarkMode) {
    const opacity = typeof shadow.shadowOpacity === 'number' ? shadow.shadowOpacity : 0;
    return {
      ...shadow,
      shadowOpacity: opacity * 0.5,
    };
  }
  return shadow;
}

export default Shadows;
