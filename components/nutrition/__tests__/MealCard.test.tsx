import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MealCard } from '../MealCard';
import type { MealLog } from '@/db/schema';

jest.mock('@/components/Themed', () => ({
  useColors: () => ({
    text: '#000',
    textSecondary: '#666',
    textTertiary: '#999',
    card: '#FFF',
    accent: '#E94560',
    systemBlue: '#007AFF',
    systemOrange: '#FF9500',
    systemPurple: '#AF52DE',
    separator: '#E5E5EA',
    fillTertiary: '#F2F2F7',
  }),
}));

jest.mock('@/utils/mealImage', () => ({
  getMealPhotoUri: (f: string) => `file:///mock/${f}`,
}));

describe('MealCard', () => {
  const mockOnPress = jest.fn();
  const baseMeal: MealLog = {
    id: '1',
    date: '2026-02-02',
    name: 'Chicken & Rice',
    calories: 520,
    protein: 40,
    carbs: 60,
    fat: 15,
    photoFilename: null,
    createdAt: new Date(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders meal name', () => {
    const { getByText } = render(<MealCard meal={baseMeal} onPress={mockOnPress} />);
    expect(getByText('Chicken & Rice')).toBeTruthy();
  });

  it('renders macro values', () => {
    const { getByText } = render(<MealCard meal={baseMeal} onPress={mockOnPress} />);
    expect(getByText('520 kcal')).toBeTruthy();
    expect(getByText('40g P')).toBeTruthy();
    expect(getByText('60g C')).toBeTruthy();
    expect(getByText('15g F')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const { getByTestId } = render(<MealCard meal={baseMeal} onPress={mockOnPress} />);
    fireEvent.press(getByTestId('meal-card'));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('renders photo thumbnail when photoFilename is present', () => {
    const mealWithPhoto = { ...baseMeal, photoFilename: 'meal-123.jpg' };
    const { getByTestId } = render(<MealCard meal={mealWithPhoto} onPress={mockOnPress} />);
    expect(getByTestId('meal-photo')).toBeTruthy();
  });

  it('does not render photo when photoFilename is null', () => {
    const { queryByTestId } = render(<MealCard meal={baseMeal} onPress={mockOnPress} />);
    expect(queryByTestId('meal-photo')).toBeNull();
  });
});
