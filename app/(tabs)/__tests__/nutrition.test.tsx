import React from 'react';
import { View } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import NutritionScreen from '../nutrition';

// Mock all dependencies
const mockColors = {
  text: '#000',
  textSecondary: '#666',
  textTertiary: '#999',
  accent: '#E94560',
  card: '#FFF',
  background: '#F8F9FA',
  groupedBackground: '#F8F9FA',
  separator: '#E5E5EA',
  inputBackground: '#FFF',
  inputPlaceholder: '#8E8E93',
  primary: '#1A1A2E',
  error: '#E94560',
  buttonPrimary: '#E94560',
  buttonPrimaryText: '#FFF',
  buttonSecondary: '#F2F2F7',
  buttonSecondaryText: '#000',
  fillTertiary: '#F2F2F7',
  fillQuaternary: '#F7F7F9',
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemOrange: '#FF9500',
  systemPurple: '#AF52DE',
  systemGray: '#8E8E93',
  systemGray4: '#D1D1D6',
};

jest.mock('@/components/Themed', () => {
  const { Text: RNText, View: RNView } = require('react-native');
  return {
    useColors: () => mockColors,
    Text: RNText,
    View: RNView,
  };
});

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    Gesture: { Pan: () => ({ activeOffsetX: () => ({ failOffsetY: () => ({ onUpdate: () => ({ onEnd: () => ({}) }) }) }) }) },
    GestureDetector: ({ children }: any) => <View>{children}</View>,
    GestureHandlerRootView: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) => <View {...props} />,
    Circle: (props: any) => <View {...props} />,
  };
});

jest.mock('@/utils/haptics', () => ({
  haptics: { tap: jest.fn(), success: jest.fn(), selection: jest.fn(), warning: jest.fn() },
}));

jest.mock('@/utils/mealImage', () => ({
  pickMealPhoto: jest.fn(() => Promise.resolve(null)),
  saveMealPhoto: jest.fn(() => Promise.resolve('meal-123.jpg')),
  getMealPhotoUri: (f: string) => `file:///mock/${f}`,
  deleteMealPhoto: jest.fn(),
}));

jest.mock('@/hooks/useMealTracking', () => ({
  useMealTracking: () => ({
    meals: [],
    targets: { id: 'default', calories: 2000, protein: 150, carbs: 250, fat: 65, updatedAt: new Date() },
    totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    weekSummary: [],
    loading: false,
    error: null,
    addMeal: jest.fn(),
    updateMeal: jest.fn(),
    deleteMeal: jest.fn(),
    updateTargets: jest.fn(),
    refetch: jest.fn(),
  }),
  computeMacroTotals: jest.fn(),
  getAdherenceStatus: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => cb(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

describe('NutritionScreen', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<NutritionScreen />);
    expect(getByText('Nutrition')).toBeTruthy();
  });

  it('renders the DaySelector', () => {
    const { getAllByTestId } = render(<NutritionScreen />);
    const dayButtons = getAllByTestId(/^day-button-/);
    expect(dayButtons).toHaveLength(5);
  });

  it('renders MacroRings with labels', () => {
    const { getByText } = render(<NutritionScreen />);
    expect(getByText('Calories')).toBeTruthy();
    expect(getByText('Protein')).toBeTruthy();
  });

  it('shows empty state when no meals', () => {
    const { getByText } = render(<NutritionScreen />);
    expect(getByText('No meals logged')).toBeTruthy();
  });

  it('renders the FAB add button', () => {
    const { getByTestId } = render(<NutritionScreen />);
    expect(getByTestId('fab-add-meal')).toBeTruthy();
  });

  it('opens meal form when FAB is pressed', () => {
    const { getByTestId, getByPlaceholderText } = render(<NutritionScreen />);
    fireEvent.press(getByTestId('fab-add-meal'));
    expect(getByPlaceholderText('Meal name')).toBeTruthy();
  });

  it('renders settings gear icon', () => {
    const { getByTestId } = render(<NutritionScreen />);
    expect(getByTestId('targets-settings')).toBeTruthy();
  });
});
