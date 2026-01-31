import { getStartOfWeek, getStartOfDay } from '@/hooks/useWorkoutDashboard';

function calculateStreak(workoutDates: Date[], now: Date, workedOutToday: boolean): number {
  const dateSet = new Set<string>();
  for (const d of workoutDates) {
    dateSet.add(getStartOfDay(d).toISOString());
  }

  let streak = 0;
  const checkDate = getStartOfDay(now);

  if (!workedOutToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (dateSet.has(checkDate.toISOString())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

describe('getStartOfWeek', () => {
  it('returns Monday for a Wednesday date', () => {
    const wed = new Date(2025, 0, 29, 14, 30);
    const monday = getStartOfWeek(wed);
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(27);
    expect(monday.getHours()).toBe(0);
  });

  it('returns Monday for a Monday date', () => {
    const mon = new Date(2025, 0, 27, 10, 0);
    const result = getStartOfWeek(mon);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(27);
  });

  it('returns previous Monday for a Sunday date', () => {
    const sun = new Date(2025, 1, 2, 10, 0);
    const result = getStartOfWeek(sun);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(27);
  });
});

describe('getStartOfDay', () => {
  it('zeros out time components', () => {
    const date = new Date(2025, 5, 15, 14, 30, 45, 123);
    const result = getStartOfDay(date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
    expect(result.getDate()).toBe(15);
  });
});

describe('calculateStreak', () => {
  it('returns 0 when no workouts', () => {
    const now = new Date(2025, 0, 29);
    expect(calculateStreak([], now, false)).toBe(0);
  });

  it('returns 1 when only worked out today', () => {
    const now = new Date(2025, 0, 29, 14, 0);
    const dates = [new Date(2025, 0, 29, 10, 0)];
    expect(calculateStreak(dates, now, true)).toBe(1);
  });

  it('returns streak of consecutive days including today', () => {
    const now = new Date(2025, 0, 29, 14, 0);
    const dates = [
      new Date(2025, 0, 29, 10, 0),
      new Date(2025, 0, 28, 10, 0),
      new Date(2025, 0, 27, 10, 0),
    ];
    expect(calculateStreak(dates, now, true)).toBe(3);
  });

  it('returns streak starting from yesterday when not worked out today', () => {
    const now = new Date(2025, 0, 29, 14, 0);
    const dates = [
      new Date(2025, 0, 28, 10, 0),
      new Date(2025, 0, 27, 10, 0),
    ];
    expect(calculateStreak(dates, now, false)).toBe(2);
  });

  it('breaks streak on gap day', () => {
    const now = new Date(2025, 0, 29, 14, 0);
    const dates = [
      new Date(2025, 0, 29, 10, 0),
      new Date(2025, 0, 28, 10, 0),
      new Date(2025, 0, 26, 10, 0),
    ];
    expect(calculateStreak(dates, now, true)).toBe(2);
  });

  it('handles multiple workouts on same day', () => {
    const now = new Date(2025, 0, 29, 14, 0);
    const dates = [
      new Date(2025, 0, 29, 8, 0),
      new Date(2025, 0, 29, 18, 0),
      new Date(2025, 0, 28, 10, 0),
    ];
    expect(calculateStreak(dates, now, true)).toBe(2);
  });
});
