import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DaySelector } from '../DaySelector';

jest.mock('@/components/Themed', () => ({
  useColors: () => ({
    text: '#000',
    textSecondary: '#666',
    textTertiary: '#999',
    accent: '#E94560',
    card: '#FFF',
    separator: '#E5E5EA',
    fillTertiary: '#F2F2F7',
    systemGray4: '#D1D1D6',
  }),
}));

jest.mock('@/utils/haptics', () => ({
  haptics: { tap: jest.fn(), selection: jest.fn() },
}));

describe('DaySelector', () => {
  const mockOnSelectDate = jest.fn();
  const mockOnWeekChange = jest.fn();
  // Use a known Monday: 2026-02-02
  const selectedDate = new Date(2026, 1, 2);

  const defaultProps = {
    selectedDate,
    onSelectDate: mockOnSelectDate,
    weekOffset: 0,
    onWeekChange: mockOnWeekChange,
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders 5 weekday labels', () => {
    const { getAllByTestId } = render(<DaySelector {...defaultProps} />);
    const dayButtons = getAllByTestId(/^day-button-/);
    expect(dayButtons).toHaveLength(5);
  });

  it('calls onSelectDate when a day is pressed', () => {
    const { getAllByTestId } = render(<DaySelector {...defaultProps} />);
    const dayButtons = getAllByTestId(/^day-button-/);
    fireEvent.press(dayButtons[2]); // Wednesday
    expect(mockOnSelectDate).toHaveBeenCalled();
  });

  it('renders week navigation arrows', () => {
    const { getByTestId } = render(<DaySelector {...defaultProps} />);
    expect(getByTestId('week-prev')).toBeTruthy();
    expect(getByTestId('week-next')).toBeTruthy();
  });

  it('calls onWeekChange(-1) when prev arrow pressed', () => {
    const { getByTestId } = render(<DaySelector {...defaultProps} />);
    fireEvent.press(getByTestId('week-prev'));
    expect(mockOnWeekChange).toHaveBeenCalledWith(-1);
  });
});
