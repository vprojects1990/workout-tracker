// iOS System Colors
const SystemColors = {
  // Primary colors
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

// Grayscale colors
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
    text: '#000000',
    textSecondary: '#3C3C43',
    textTertiary: '#6C6C70',
    textQuaternary: '#8E8E93',

    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F2F2F7',
    backgroundTertiary: '#E5E5EA',

    // Surfaces
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    groupedBackground: '#F2F2F7',

    // Borders & separators
    separator: '#C6C6C8',
    separatorOpaque: '#C6C6C8',
    border: '#D1D1D6',

    // System colors
    primary: SystemColors.blue.light,
    success: SystemColors.green.light,
    warning: SystemColors.orange.light,
    error: SystemColors.red.light,

    // iOS system colors
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

    // Interactive
    tint: SystemColors.blue.light,
    link: SystemColors.blue.light,

    // Input
    inputBackground: '#E5E5EA',
    inputPlaceholder: '#8E8E93',

    // Button states
    buttonDisabled: '#C7C7CC',
    buttonDisabledText: '#8E8E93',

    // Tab bar
    tabIconDefault: '#8E8E93',
    tabIconSelected: SystemColors.blue.light,

    // Fill colors (for tinted backgrounds)
    fillPrimary: '#E5E5EA',
    fillSecondary: '#EBEBF0',
    fillTertiary: '#F2F2F7',
    fillQuaternary: '#F7F7F9',
  },
  dark: {
    // Base colors
    text: '#FFFFFF',
    textSecondary: '#EBEBF5',
    textTertiary: '#EBEBF599',
    textQuaternary: '#EBEBF54D',

    // Backgrounds
    background: '#000000',
    backgroundSecondary: '#1C1C1E',
    backgroundTertiary: '#2C2C2E',

    // Surfaces
    card: '#1C1C1E',
    cardElevated: '#2C2C2E',
    groupedBackground: '#000000',

    // Borders & separators
    separator: '#54545899',
    separatorOpaque: '#38383A',
    border: '#38383A',

    // System colors
    primary: SystemColors.blue.dark,
    success: SystemColors.green.dark,
    warning: SystemColors.orange.dark,
    error: SystemColors.red.dark,

    // iOS system colors
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
    tint: SystemColors.blue.dark,
    link: SystemColors.blue.dark,

    // Input
    inputBackground: '#7676803D',
    inputPlaceholder: '#EBEBF599',

    // Button states
    buttonDisabled: '#EBEBF54D',
    buttonDisabledText: '#EBEBF54D',

    // Tab bar
    tabIconDefault: '#8E8E93',
    tabIconSelected: SystemColors.blue.dark,

    // Fill colors (for tinted backgrounds)
    fillPrimary: '#78788052',
    fillSecondary: '#78788047',
    fillTertiary: '#7676803D',
    fillQuaternary: '#78788028',
  },
};

export type ColorScheme = keyof typeof Colors;
export type ColorKey = keyof typeof Colors.light;

export default Colors;
