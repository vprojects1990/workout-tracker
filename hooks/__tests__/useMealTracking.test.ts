import { computeMacroTotals, getAdherenceStatus } from '@/hooks/useMealTracking';
import type { MacroTotals, MealInput, WeekDaySummary } from '@/hooks/useMealTracking';

describe('useMealTracking', () => {
  describe('computeMacroTotals', () => {
    it('returns zeros for empty meals array', () => {
      const totals = computeMacroTotals([]);
      expect(totals).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    });

    it('sums a single meal correctly', () => {
      const meals = [
        { calories: 500, protein: 40, carbs: 60, fat: 15 },
      ];
      const totals = computeMacroTotals(meals);
      expect(totals).toEqual({ calories: 500, protein: 40, carbs: 60, fat: 15 });
    });

    it('sums multiple meals correctly', () => {
      const meals = [
        { calories: 500, protein: 40, carbs: 60, fat: 15 },
        { calories: 300, protein: 25, carbs: 30, fat: 10 },
        { calories: 700, protein: 50, carbs: 80, fat: 20 },
      ];
      const totals = computeMacroTotals(meals);
      expect(totals).toEqual({ calories: 1500, protein: 115, carbs: 170, fat: 45 });
    });

    it('handles decimal values', () => {
      const meals = [
        { calories: 250, protein: 22.5, carbs: 30.3, fat: 8.7 },
        { calories: 350, protein: 18.2, carbs: 45.1, fat: 12.3 },
      ];
      const totals = computeMacroTotals(meals);
      expect(totals.calories).toBe(600);
      expect(totals.protein).toBeCloseTo(40.7);
      expect(totals.carbs).toBeCloseTo(75.4);
      expect(totals.fat).toBeCloseTo(21.0);
    });
  });

  describe('getAdherenceStatus', () => {
    it('returns "no-data" when no meals logged', () => {
      expect(getAdherenceStatus(0, 0, 2000)).toBe('no-data');
    });

    it('returns "on-target" when within 10% of target', () => {
      // 1950 / 2000 = 0.975 → within 10%
      expect(getAdherenceStatus(1950, 3, 2000)).toBe('on-target');
    });

    it('returns "on-target" at exactly target', () => {
      expect(getAdherenceStatus(2000, 3, 2000)).toBe('on-target');
    });

    it('returns "close" when 75-90% of target', () => {
      // 1600 / 2000 = 0.8 → close
      expect(getAdherenceStatus(1600, 3, 2000)).toBe('close');
    });

    it('returns "off-target" when below 75% of target', () => {
      // 1000 / 2000 = 0.5 → off-target
      expect(getAdherenceStatus(1000, 2, 2000)).toBe('off-target');
    });

    it('returns "over" when more than 110% of target', () => {
      // 2300 / 2000 = 1.15 → over
      expect(getAdherenceStatus(2300, 4, 2000)).toBe('over');
    });

    it('returns "no-data" when target is 0', () => {
      expect(getAdherenceStatus(500, 2, 0)).toBe('no-data');
    });
  });
});
