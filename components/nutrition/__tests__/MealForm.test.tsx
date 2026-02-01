import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MealForm } from '../MealForm';

jest.mock('@/components/Themed', () => ({
  useColors: () => ({
    text: '#000',
    textSecondary: '#666',
    textTertiary: '#999',
    accent: '#E94560',
    card: '#FFF',
    background: '#F8F9FA',
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
    systemGray: '#8E8E93',
  }),
}));

jest.mock('@/utils/haptics', () => ({
  haptics: { tap: jest.fn(), success: jest.fn() },
}));

jest.mock('@/utils/mealImage', () => ({
  pickMealPhoto: jest.fn(() => Promise.resolve(null)),
  saveMealPhoto: jest.fn(() => Promise.resolve('meal-123.jpg')),
  getMealPhotoUri: (f: string) => `file:///mock/${f}`,
}));

describe('MealForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders all input fields', () => {
    const { getByPlaceholderText } = render(<MealForm {...defaultProps} />);
    expect(getByPlaceholderText('Meal name')).toBeTruthy();
    expect(getByPlaceholderText('Calories')).toBeTruthy();
    expect(getByPlaceholderText('Protein (g)')).toBeTruthy();
    expect(getByPlaceholderText('Carbs (g)')).toBeTruthy();
    expect(getByPlaceholderText('Fat (g)')).toBeTruthy();
  });

  it('renders save and cancel buttons', () => {
    const { getByText } = render(<MealForm {...defaultProps} />);
    expect(getByText('Save Meal')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('calls onCancel when cancel is pressed', () => {
    const { getByText } = render(<MealForm {...defaultProps} />);
    fireEvent.press(getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('pre-fills values in edit mode', () => {
    const initialValues = {
      name: 'Chicken',
      calories: 500,
      protein: 40,
      carbs: 60,
      fat: 15,
    };
    const { getByDisplayValue } = render(
      <MealForm {...defaultProps} initialValues={initialValues} />
    );
    expect(getByDisplayValue('Chicken')).toBeTruthy();
    expect(getByDisplayValue('500')).toBeTruthy();
  });

  it('renders add photo button', () => {
    const { getByText } = render(<MealForm {...defaultProps} />);
    expect(getByText('Add Photo')).toBeTruthy();
  });
});
