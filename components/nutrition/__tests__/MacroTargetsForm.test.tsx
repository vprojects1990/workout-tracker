import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MacroTargetsForm } from '../MacroTargetsForm';

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
  }),
}));

jest.mock('@/utils/haptics', () => ({
  haptics: { tap: jest.fn(), success: jest.fn() },
}));

describe('MacroTargetsForm', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    currentTargets: { calories: 2000, protein: 150, carbs: 250, fat: 65 },
    onSave: mockOnSave,
    onCancel: mockOnCancel,
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders 4 numeric inputs pre-filled with current targets', () => {
    const { getByDisplayValue } = render(<MacroTargetsForm {...defaultProps} />);
    expect(getByDisplayValue('2000')).toBeTruthy();
    expect(getByDisplayValue('150')).toBeTruthy();
    expect(getByDisplayValue('250')).toBeTruthy();
    expect(getByDisplayValue('65')).toBeTruthy();
  });

  it('renders save and cancel buttons', () => {
    const { getByText } = render(<MacroTargetsForm {...defaultProps} />);
    expect(getByText('Save Targets')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('calls onCancel when cancel pressed', () => {
    const { getByText } = render(<MacroTargetsForm {...defaultProps} />);
    fireEvent.press(getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
