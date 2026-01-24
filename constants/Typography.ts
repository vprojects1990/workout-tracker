import { Platform, TextStyle } from 'react-native';

// iOS system font weights
const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

// iOS Dynamic Type scale
// Based on Apple Human Interface Guidelines
export const Typography = {
  // Large Title - Navigation bars, prominent headers
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.37,
  } as TextStyle,

  // Title 1 - Major section headers
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.36,
  } as TextStyle,

  // Title 2 - Secondary section headers
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.35,
  } as TextStyle,

  // Title 3 - Tertiary headers
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.38,
  } as TextStyle,

  // Headline - Important text, list headers
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: fontWeights.semibold,
    letterSpacing: -0.41,
  } as TextStyle,

  // Body - Default reading text
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: fontWeights.regular,
    letterSpacing: -0.41,
  } as TextStyle,

  // Callout - Slightly smaller than body
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: fontWeights.regular,
    letterSpacing: -0.32,
  } as TextStyle,

  // Subhead - Secondary text
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: fontWeights.regular,
    letterSpacing: -0.24,
  } as TextStyle,

  // Footnote - Small supporting text
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: fontWeights.regular,
    letterSpacing: -0.08,
  } as TextStyle,

  // Caption 1 - Labels, timestamps
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.regular,
    letterSpacing: 0,
  } as TextStyle,

  // Caption 2 - Smallest readable text
  caption2: {
    fontSize: 11,
    lineHeight: 13,
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
    fontWeight: fontWeights.semibold,
  } as TextStyle,
  buttonSmall: {
    ...Typography.subhead,
    fontWeight: fontWeights.semibold,
  } as TextStyle,
  link: {
    ...Typography.body,
    fontWeight: fontWeights.regular,
  } as TextStyle,

  // Form elements
  label: Typography.subhead,
  input: Typography.body,
  placeholder: Typography.body,
  error: Typography.footnote,
  helper: Typography.caption1,

  // Data display
  statValue: {
    ...Typography.title1,
    fontWeight: fontWeights.bold,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
  statLabel: Typography.caption1,

  // Badge
  badge: {
    ...Typography.caption2,
    fontWeight: fontWeights.semibold,
  } as TextStyle,

  // Tab bar
  tabLabel: {
    ...Typography.caption2,
    fontWeight: fontWeights.medium,
  } as TextStyle,
};

export const FontWeights = fontWeights;

export default Typography;
