import React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';
import { MacroRings } from '../MacroRings';

jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) => <View {...props} />,
    Circle: (props: any) => <View {...props} />,
  };
});

jest.mock('@/components/Themed', () => ({
  useColors: () => ({
    accent: '#E94560',
    systemBlue: '#007AFF',
    systemOrange: '#FF9500',
    systemPurple: '#AF52DE',
    text: '#000',
    textSecondary: '#666',
    textTertiary: '#999',
    fillTertiary: '#F2F2F7',
  }),
}));

describe('MacroRings', () => {
  const defaultProps = {
    totals: { calories: 1500, protein: 100, carbs: 150, fat: 50 },
    targets: { calories: 2000, protein: 150, carbs: 250, fat: 65 },
  };

  it('renders 4 macro labels', () => {
    const { getByText } = render(<MacroRings {...defaultProps} />);
    expect(getByText('Calories')).toBeTruthy();
    expect(getByText('Protein')).toBeTruthy();
    expect(getByText('Carbs')).toBeTruthy();
    expect(getByText('Fat')).toBeTruthy();
  });

  it('displays current/target values', () => {
    const { getByText, getAllByText } = render(<MacroRings {...defaultProps} />);
    expect(getByText('1500')).toBeTruthy();
    expect(getByText('100')).toBeTruthy();
    // 150 appears twice: protein current (100) target (150) and carbs current (150)
    expect(getAllByText('150').length).toBeGreaterThanOrEqual(1);
    expect(getByText('50')).toBeTruthy();
  });

  it('handles zero targets without crashing', () => {
    const zeroTargets = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const { getByText } = render(
      <MacroRings totals={defaultProps.totals} targets={zeroTargets} />
    );
    expect(getByText('Calories')).toBeTruthy();
  });
});
