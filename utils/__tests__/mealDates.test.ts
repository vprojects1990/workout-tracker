import {
  isWeekday,
  formatDateKey,
  isToday,
  isFutureDate,
  canLogMeal,
  getWeekdaysOfWeek,
  getDayLabel,
} from '@/utils/mealDates';

describe('mealDates', () => {
  describe('isWeekday', () => {
    it('returns true for Monday', () => {
      // 2026-02-02 is a Monday
      expect(isWeekday(new Date(2026, 1, 2))).toBe(true);
    });

    it('returns true for Friday', () => {
      // 2026-02-06 is a Friday
      expect(isWeekday(new Date(2026, 1, 6))).toBe(true);
    });

    it('returns false for Saturday', () => {
      // 2026-02-07 is a Saturday
      expect(isWeekday(new Date(2026, 1, 7))).toBe(false);
    });

    it('returns false for Sunday', () => {
      // 2026-02-01 is a Sunday
      expect(isWeekday(new Date(2026, 1, 1))).toBe(false);
    });

    it('returns true for Wednesday', () => {
      // 2026-02-04 is a Wednesday
      expect(isWeekday(new Date(2026, 1, 4))).toBe(true);
    });
  });

  describe('formatDateKey', () => {
    it('formats a date as YYYY-MM-DD', () => {
      expect(formatDateKey(new Date(2026, 1, 3))).toBe('2026-02-03');
    });

    it('pads single-digit month and day', () => {
      expect(formatDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    });

    it('handles December correctly', () => {
      expect(formatDateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
    });
  });

  describe('isToday', () => {
    it('returns true for today', () => {
      expect(isToday(new Date())).toBe(true);
    });

    it('returns false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it('returns false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });
  });

  describe('isFutureDate', () => {
    it('returns false for today', () => {
      expect(isFutureDate(new Date())).toBe(false);
    });

    it('returns true for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isFutureDate(tomorrow)).toBe(true);
    });

    it('returns false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isFutureDate(yesterday)).toBe(false);
    });
  });

  describe('canLogMeal', () => {
    it('returns true for a past weekday', () => {
      // Find a past Monday
      const date = new Date();
      // Go back to last Monday
      const day = date.getDay();
      const diff = day === 0 ? 6 : day - 1; // days since last Monday
      date.setDate(date.getDate() - diff - 7); // last week's Monday
      expect(canLogMeal(date)).toBe(true);
    });

    it('returns false for a future date', () => {
      const future = new Date();
      future.setDate(future.getDate() + 7);
      // Ensure it's a weekday
      while (future.getDay() === 0 || future.getDay() === 6) {
        future.setDate(future.getDate() + 1);
      }
      expect(canLogMeal(future)).toBe(false);
    });

    it('returns false for a past Saturday', () => {
      // 2026-01-31 is a Saturday
      expect(canLogMeal(new Date(2026, 0, 31))).toBe(false);
    });
  });

  describe('getWeekdaysOfWeek', () => {
    it('returns 5 dates for current week (offset 0)', () => {
      const days = getWeekdaysOfWeek(0);
      expect(days).toHaveLength(5);
    });

    it('returns Mon-Fri in order', () => {
      const days = getWeekdaysOfWeek(0);
      // Monday = 1, Friday = 5
      expect(days[0].getDay()).toBe(1); // Monday
      expect(days[1].getDay()).toBe(2); // Tuesday
      expect(days[2].getDay()).toBe(3); // Wednesday
      expect(days[3].getDay()).toBe(4); // Thursday
      expect(days[4].getDay()).toBe(5); // Friday
    });

    it('returns previous week dates with offset -1', () => {
      const thisWeek = getWeekdaysOfWeek(0);
      const lastWeek = getWeekdaysOfWeek(-1);
      // Last week's Monday should be 7 days before this week's Monday
      const diffMs = thisWeek[0].getTime() - lastWeek[0].getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(7);
    });

    it('returns consecutive dates within the week', () => {
      const days = getWeekdaysOfWeek(0);
      for (let i = 1; i < days.length; i++) {
        const diffMs = days[i].getTime() - days[i - 1].getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        expect(diffDays).toBe(1);
      }
    });
  });

  describe('getDayLabel', () => {
    it('returns short day names', () => {
      // Monday
      expect(getDayLabel(new Date(2026, 1, 2))).toBe('Mon');
      // Friday
      expect(getDayLabel(new Date(2026, 1, 6))).toBe('Fri');
    });
  });
});
