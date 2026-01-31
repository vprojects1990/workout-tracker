import { convertWeight, convertToKg } from '@/hooks/useSettings';

describe('convertWeight', () => {
  it('returns kg value unchanged when unit is kg', () => {
    expect(convertWeight(100, 'kg')).toBe(100);
  });

  it('converts kg to lbs', () => {
    expect(convertWeight(100, 'lbs')).toBe(220.5);
  });

  it('converts small kg to lbs', () => {
    expect(convertWeight(1, 'lbs')).toBe(2.2);
  });

  it('handles zero', () => {
    expect(convertWeight(0, 'kg')).toBe(0);
    expect(convertWeight(0, 'lbs')).toBe(0);
  });

  it('rounds to one decimal place for lbs', () => {
    // 45 * 2.20462 = 99.2079 → should round to 99.2
    expect(convertWeight(45, 'lbs')).toBe(99.2);
  });
});

describe('convertToKg', () => {
  it('returns kg value unchanged when unit is kg', () => {
    expect(convertToKg(100, 'kg')).toBe(100);
  });

  it('converts lbs to kg', () => {
    expect(convertToKg(220.5, 'lbs')).toBe(100);
  });

  it('converts small lbs to kg', () => {
    expect(convertToKg(2.2, 'lbs')).toBe(1);
  });

  it('handles zero', () => {
    expect(convertToKg(0, 'kg')).toBe(0);
    expect(convertToKg(0, 'lbs')).toBe(0);
  });

  it('rounds to one decimal place for lbs conversion', () => {
    // 100 / 2.20462 = 45.3592... → should round to 45.4
    expect(convertToKg(100, 'lbs')).toBe(45.4);
  });
});
