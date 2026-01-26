// Brand Colors - "Focused Intensity" palette
const BrandColors = {
  // Primary - Deep Navy (authority, focus)
  primary: { light: '#1A1A2E', dark: '#E94560' },
  // Accent - Coral Red (energy, PRs, achievements)
  accent: { light: '#E94560', dark: '#E94560' },
  // Success - Mint (completed sets, progress)
  success: { light: '#06D6A0', dark: '#06D6A0' },
  // Warning - kept similar to iOS for familiarity
  warning: { light: '#FF9500', dark: '#FF9F0A' },
  // Error - slightly adjusted red
  error: { light: '#E94560', dark: '#FF6B6B' },
};

// iOS System Colors (kept for compatibility)
const SystemColors = {
  blue: { light: '#007AFF', dark: '#0A84FF' },
  green: { light: '#34C759', dark: '#30D158' },
  red: { light: '#FF3B30', dark: '#FF453A' },
  orange: { light: '#FF9500', dark: '#FF9F0A' },
  yellow: { light: '#FFCC00', dark: '#FFD60A' },
  teal: { light: '#5AC8FA', dark: '#64D2FF' },
  purple: { light: '#AF52DE', dark: '#BF5AF2' },
  pink: { light: '#FF2D55', dark: '#FF375F' },
  indigo: { light: '#5856D6', dark: '#5E5CE6' },
};

// Grayscale colors - refined for the new palette
const Grays = {
  gray: { light: '#8E8E93', dark: '#8E8E93' },
  gray2: { light: '#AEAEB2', dark: '#636366' },
  gray3: { light: '#C7C7CC', dark: '#48484A' },
  gray4: { light: '#D1D1D6', dark: '#3A3A3C' },
  gray5: { light: '#E5E5EA', dark: '#2C2C2E' },
  gray6: { light: '#F2F2F7', dark: '#1C1C1E' },
};

const Colors = {
  light: {
    // Base colors
    text: '#1A1A2E', // Deep navy for better contrast than pure black
    textSecondary: '#3C3C43',
    textTertiary: '#6C6C70',
    textQuaternary: '#8E8E93',

    // Backgrounds - softer off-white
    background: '#F8F9FA',
    backgroundSecondary: '#FFFFFF',
    backgroundTertiary: '#F2F2F7',

    // Surfaces
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    groupedBackground: '#F8F9FA',

    // Borders & separators
    separator: '#E5E5EA',
    separatorOpaque: '#D1D1D6',
    border: '#E5E5EA',

    // Brand colors
    primary: BrandColors.primary.light,
    accent: BrandColors.accent.light,
    success: BrandColors.success.light,
    warning: BrandColors.warning.light,
    error: BrandColors.error.light,

    // iOS system colors (for compatibility)
    systemBlue: SystemColors.blue.light,
    systemGreen: SystemColors.green.light,
    systemRed: SystemColors.red.light,
    systemOrange: SystemColors.orange.light,
    systemYellow: SystemColors.yellow.light,
    systemTeal: SystemColors.teal.light,
    systemPurple: SystemColors.purple.light,
    systemPink: SystemColors.pink.light,
    systemIndigo: SystemColors.indigo.light,

    // Grays
    systemGray: Grays.gray.light,
    systemGray2: Grays.gray2.light,
    systemGray3: Grays.gray3.light,
    systemGray4: Grays.gray4.light,
    systemGray5: Grays.gray5.light,
    systemGray6: Grays.gray6.light,

    // Interactive - using accent color for CTAs
    tint: BrandColors.accent.light,
    link: BrandColors.accent.light,

    // Input
    inputBackground: '#FFFFFF',
    inputPlaceholder: '#8E8E93',
    inputBorder: '#E5E5EA',

    // Button states
    buttonPrimary: BrandColors.accent.light,
    buttonPrimaryText: '#FFFFFF',
    buttonSecondary: '#F2F2F7',
    buttonSecondaryText: '#1A1A2E',
    buttonDisabled: '#E5E5EA',
    buttonDisabledText: '#AEAEB2',

    // Tab bar
    tabIconDefault: '#8E8E93',
    tabIconSelected: BrandColors.accent.light,

    // Fill colors (for tinted backgrounds)
    fillPrimary: '#E5E5EA',
    fillSecondary: '#EBEBF0',
    fillTertiary: '#F2F2F7',
    fillQuaternary: '#F7F7F9',

    // Semantic colors for workout app
    prBadge: BrandColors.accent.light, // Personal record
    streakActive: '#FF9500', // Active streak flame
    completedSet: BrandColors.success.light,
    pendingSet: '#E5E5EA',
    restTimer: BrandColors.accent.light,

    // Muscle group colors (for visual variety)
    muscleChest: '#E94560',
    muscleBack: '#5856D6',
    muscleLegs: '#06D6A0',
    muscleShoulders: '#FF9500',
    muscleArms: '#5AC8FA',
    muscleCore: '#AF52DE',
  },
  dark: {
    // Base colors
    text: '#FFFFFF',
    textSecondary: '#EBEBF5',
    textTertiary: 'rgba(235, 235, 245, 0.6)',
    textQuaternary: 'rgba(235, 235, 245, 0.3)',

    // Backgrounds - near black with slight blue tint
    background: '#0F0F14',
    backgroundSecondary: '#1A1A24',
    backgroundTertiary: '#252530',

    // Surfaces - elevated cards
    card: '#1A1A24',
    cardElevated: '#252530',
    groupedBackground: '#0F0F14',

    // Borders & separators
    separator: 'rgba(84, 84, 88, 0.6)',
    separatorOpaque: '#38383A',
    border: '#38383A',

    // Brand colors
    primary: BrandColors.primary.dark,
    accent: BrandColors.accent.dark,
    success: BrandColors.success.dark,
    warning: BrandColors.warning.dark,
    error: BrandColors.error.dark,

    // iOS system colors (for compatibility)
    systemBlue: SystemColors.blue.dark,
    systemGreen: SystemColors.green.dark,
    systemRed: SystemColors.red.dark,
    systemOrange: SystemColors.orange.dark,
    systemYellow: SystemColors.yellow.dark,
    systemTeal: SystemColors.teal.dark,
    systemPurple: SystemColors.purple.dark,
    systemPink: SystemColors.pink.dark,
    systemIndigo: SystemColors.indigo.dark,

    // Grays
    systemGray: Grays.gray.dark,
    systemGray2: Grays.gray2.dark,
    systemGray3: Grays.gray3.dark,
    systemGray4: Grays.gray4.dark,
    systemGray5: Grays.gray5.dark,
    systemGray6: Grays.gray6.dark,

    // Interactive
    tint: BrandColors.accent.dark,
    link: BrandColors.accent.dark,

    // Input
    inputBackground: 'rgba(118, 118, 128, 0.24)',
    inputPlaceholder: 'rgba(235, 235, 245, 0.6)',
    inputBorder: '#38383A',

    // Button states
    buttonPrimary: BrandColors.accent.dark,
    buttonPrimaryText: '#FFFFFF',
    buttonSecondary: '#252530',
    buttonSecondaryText: '#FFFFFF',
    buttonDisabled: 'rgba(235, 235, 245, 0.3)',
    buttonDisabledText: 'rgba(235, 235, 245, 0.3)',

    // Tab bar
    tabIconDefault: '#8E8E93',
    tabIconSelected: BrandColors.accent.dark,

    // Fill colors (for tinted backgrounds)
    fillPrimary: 'rgba(120, 120, 128, 0.32)',
    fillSecondary: 'rgba(120, 120, 128, 0.28)',
    fillTertiary: 'rgba(118, 118, 128, 0.24)',
    fillQuaternary: 'rgba(120, 120, 128, 0.16)',

    // Semantic colors for workout app
    prBadge: BrandColors.accent.dark,
    streakActive: '#FFD60A',
    completedSet: BrandColors.success.dark,
    pendingSet: '#38383A',
    restTimer: BrandColors.accent.dark,

    // Muscle group colors (for visual variety)
    muscleChest: '#E94560',
    muscleBack: '#5E5CE6',
    muscleLegs: '#06D6A0',
    muscleShoulders: '#FF9F0A',
    muscleArms: '#64D2FF',
    muscleCore: '#BF5AF2',
  },
};

export type ColorScheme = keyof typeof Colors;
export type ColorKey = keyof typeof Colors.light;

export default Colors;
