// iOS-style spacing system
// Based on 4pt grid with common iOS spacing values

export const Spacing = {
  // Base spacing values (4pt grid)
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // Larger spacing for sections
  section: 40,
  screen: 48,
};

// Border radius values
export const Radius = {
  // Small elements (badges, small buttons)
  xs: 4,
  small: 6,

  // Standard interactive elements
  medium: 8,

  // Cards, larger containers
  large: 12,

  // Modal sheets, large cards
  xl: 16,

  // Full rounded (pills, circular elements)
  xxl: 20,
  full: 9999,
};

// Common layout values
export const Layout = {
  // Screen padding
  screenPaddingHorizontal: Spacing.lg,
  screenPaddingVertical: Spacing.xl,

  // Safe area defaults (actual values come from useSafeAreaInsets)
  statusBarHeight: 44,
  tabBarHeight: 49,
  headerHeight: 44,

  // Content width constraints
  maxContentWidth: 428, // iPhone 14 Pro Max width

  // List items
  listItemMinHeight: 44, // iOS minimum touch target
  listItemPaddingVertical: Spacing.md,
  listItemPaddingHorizontal: Spacing.lg,

  // Card spacing
  cardPadding: Spacing.lg,
  cardGap: Spacing.md,

  // Section spacing
  sectionGap: Spacing.xxl,
  sectionHeaderMargin: Spacing.sm,

  // Form elements
  inputHeight: 44,
  buttonHeight: 50,
  buttonHeightSmall: 36,
  buttonHeightLarge: 56,

  // Icon sizes
  iconSizeSmall: 16,
  iconSizeMedium: 20,
  iconSizeLarge: 24,
  iconSizeXL: 28,
};

// Gap values for flexbox layouts
export const Gap = {
  xs: Spacing.xs,
  sm: Spacing.sm,
  md: Spacing.md,
  lg: Spacing.lg,
  xl: Spacing.xl,
};

export default Spacing;
