/**
 * Weekday-aware date utilities for meal tracking (Mon-Fri only).
 */

/** Returns true if the date falls on Monday–Friday. */
export function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

/** Formats a date as 'YYYY-MM-DD' for use as a DB key. */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns true if the date is today (date-only comparison). */
export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** Returns true if the date is strictly after today. */
export function isFutureDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return target.getTime() > today.getTime();
}

/** Returns true if a meal can be logged for this date (weekday and not future). */
export function canLogMeal(date: Date): boolean {
  return isWeekday(date) && !isFutureDate(date);
}

/**
 * Returns the Mon–Fri dates for a week relative to the current week.
 * @param weekOffset 0 = current week, -1 = last week, etc.
 */
export function getWeekdaysOfWeek(weekOffset: number): Date[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Find Monday of the current week
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);

  const days: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

/** Returns a short day label like 'Mon', 'Tue', etc. */
export function getDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}
