import React from 'react';
import { render } from '@testing-library/react-native';
import { NutritionEmptyState } from '../NutritionEmptyState';

jest.mock('@/components/Themed', () => ({
  useColors: () => ({
    text: '#000',
    textSecondary: '#666',
    textTertiary: '#999',
    accent: '#E94560',
    systemGray: '#8E8E93',
  }),
}));

describe('NutritionEmptyState', () => {
  it('renders empty state message', () => {
    const { getByText } = render(<NutritionEmptyState />);
    expect(getByText('No meals logged')).toBeTruthy();
  });

  it('renders add meal prompt', () => {
    const { getByText } = render(<NutritionEmptyState />);
    expect(getByText(/Tap.*to log your first meal/)).toBeTruthy();
  });
});
