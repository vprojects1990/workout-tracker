import { Platform, TextStyle } from 'react-native';

// Font families
export const FontFamilies = {
  // Display font - for headers and titles
  display: {
    regular: 'DMSans-Regular',
    medium: 'DMSans-Medium',
    semibold: 'DMSans-SemiBold',
    bold: 'DMSans-Bold',
  },
  // Body font - same as display for consistency
  body: {
    regular: 'DMSans-Regular',
    medium: 'DMSans-Medium',
    semibold: 'DMSans-SemiBold',
    bold: 'DMSans-Bold',
  },
  // Monospace font - for numbers and stats
  mono: 'SpaceMono',
};

// Font weights (for system font fallback)
const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

// iOS Dynamic Type scale with custom fonts
// Based on Apple Human Interface Guidelines
export const Typography = {
  // Large Title - Navigation bars, prominent headers
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontFamily: FontFamilies.display.bold,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.37,
  } as TextStyle,

  // Title 1 - Major section headers
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: FontFamilies.display.bold,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.36,
  } as TextStyle,

  // Title 2 - Secondary section headers
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: FontFamilies.display.bold,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.35,
  } as TextStyle,

  // Title 3 - Tertiary headers
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontFamily: FontFamilies.display.semibold,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.38,
  } as TextStyle,

  // Headline - Important text, list headers
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: FontFamilies.body.semibold,
    fontWeight: fontWeights.semibold,
    letterSpacing: -0.41,
  } as TextStyle,

  // Body - Default reading text
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: FontFamilies.body.regular,
    fontWeight: fontWeights.regular,
    letterSpacing: -0.41,
  } as TextStyle,

  // Callout - Slightly smaller than body
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontFamily: FontFamilies.body.regular,
    fontWeight: fontWeights.regular,
    letterSpacing: -0.32,
  } as TextStyle,

  // Subhead - Secondary text
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: FontFamilies.body.regular,
    fontWeight: fontWeights.regular,
    letterSpacing: -0.24,
  } as TextStyle,

  // Footnote - Small supporting text
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FontFamilies.body.regular,
    fontWeight: fontWeights.regular,
    letterSpacing: -0.08,
  } as TextStyle,

  // Caption 1 - Labels, timestamps
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FontFamilies.body.regular,
    fontWeight: fontWeights.regular,
    letterSpacing: 0,
  } as TextStyle,

  // Caption 2 - Smallest readable text
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontFamily: FontFamilies.body.regular,
    fontWeight: fontWeights.regular,
    letterSpacing: 0.07,
  } as TextStyle,
};

// Semantic typography aliases for common use cases
export const TextStyles = {
  // Headers
  screenTitle: Typography.largeTitle,
  sectionTitle: Typography.title2,
  cardTitle: Typography.headline,
  listHeader: Typography.headline,

  // Body text
  primary: Typography.body,
  secondary: Typography.subhead,
  tertiary: Typography.footnote,

  // Interactive
  button: {
    ...Typography.body,
    fontFamily: FontFamilies.body.semibold,
    fontWeight: fontWeights.semibold,
  } as TextStyle,
  buttonSmall: {
    ...Typography.subhead,
    fontFamily: FontFamilies.body.semibold,
    fontWeight: fontWeights.semibold,
  } as TextStyle,
  link: {
    ...Typography.body,
    fontFamily: FontFamilies.body.regular,
    fontWeight: fontWeights.regular,
  } as TextStyle,

  // Form elements
  label: {
    ...Typography.subhead,
    fontFamily: FontFamilies.body.medium,
    fontWeight: fontWeights.medium,
  } as TextStyle,
  input: Typography.body,
  placeholder: Typography.body,
  error: Typography.footnote,
  helper: Typography.caption1,

  // Data display - using monospace for consistent number alignment
  statValue: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: FontFamilies.display.bold,
    fontWeight: fontWeights.bold,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.36,
  } as TextStyle,
  statValueLarge: {
    fontSize: 48,
    lineHeight: 56,
    fontFamily: FontFamilies.display.bold,
    fontWeight: fontWeights.bold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  } as TextStyle,
  statValueSmall: {
    fontSize: 20,
    lineHeight: 25,
    fontFamily: FontFamilies.display.semibold,
    fontWeight: fontWeights.semibold,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.38,
  } as TextStyle,
  statLabel: {
    ...Typography.caption1,
    fontFamily: FontFamilies.body.medium,
    fontWeight: fontWeights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,

  // Numeric displays (weights, reps, etc.)
  numericInput: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: FontFamilies.mono,
    fontWeight: fontWeights.medium,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
  numericSmall: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: FontFamilies.mono,
    fontWeight: fontWeights.regular,
    fontVariant: ['tabular-nums'],
  } as TextStyle,

  // Badge
  badge: {
    ...Typography.caption2,
    fontFamily: FontFamilies.body.semibold,
    fontWeight: fontWeights.semibold,
  } as TextStyle,
  badgeLarge: {
    ...Typography.footnote,
    fontFamily: FontFamilies.body.bold,
    fontWeight: fontWeights.bold,
  } as TextStyle,

  // Tab bar
  tabLabel: {
    ...Typography.caption2,
    fontFamily: FontFamilies.body.medium,
    fontWeight: fontWeights.medium,
  } as TextStyle,

  // Workout-specific
  exerciseName: {
    ...Typography.headline,
    fontFamily: FontFamilies.display.semibold,
    fontWeight: fontWeights.semibold,
  } as TextStyle,
  setNumber: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: FontFamilies.body.bold,
    fontWeight: fontWeights.bold,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
  timerDisplay: {
    fontSize: 64,
    lineHeight: 72,
    fontFamily: FontFamilies.mono,
    fontWeight: fontWeights.bold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  } as TextStyle,
  streakCount: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: FontFamilies.display.bold,
    fontWeight: fontWeights.bold,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
};

export const FontWeights = fontWeights;

export default Typography;
