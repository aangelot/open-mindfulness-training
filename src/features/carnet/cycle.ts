/**
 * Cycle arithmetic. Pure functions, covered by cycle.test.ts.
 *
 * A cycle advances one day per filled day ("jour par jour"), not by calendar:
 * a break does not skip days. The day to fill today is the one already started
 * today, otherwise the next one.
 */
import { PROGRAM } from './program';

export const DAYS_PER_WEEK = 7;
export const TOTAL_DAYS = PROGRAM.length * DAYS_PER_WEEK; // 56

/** 1-based week of a 0-based day index. */
export const weekOf = (dayIndex: number) => Math.floor(dayIndex / DAYS_PER_WEEK) + 1;
/** 1-based day within its week (J1–J7). */
export const dayInWeek = (dayIndex: number) => (dayIndex % DAYS_PER_WEEK) + 1;
/** Day indexes of a week. */
export const daysOfWeek = (week: number) =>
  Array.from({ length: DAYS_PER_WEEK }, (_, i) => (week - 1) * DAYS_PER_WEEK + i);

export const programWeek = (week: number) => PROGRAM[Math.min(Math.max(week, 1), PROGRAM.length) - 1];

/** Local calendar date as YYYY-MM-DD. */
export function localDate(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "YYYY-MM-DD" → Date at local midnight (avoids the UTC shift of `new Date(iso)`). */
export const parseLocalDate = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export interface DayRef {
  dayIndex: number;
  date: string;
}

/** Day to fill today, or null once the 56 days are filled. */
export function currentDayIndex(days: readonly DayRef[], today: string): number | null {
  let last = -1;
  let todays = -1;
  for (const d of days) {
    last = Math.max(last, d.dayIndex);
    if (d.date === today) todays = Math.max(todays, d.dayIndex);
  }
  if (todays >= 0) return todays;
  return last + 1 < TOTAL_DAYS ? last + 1 : null;
}

/** Number of distinct days filled. */
export const filledDays = (days: readonly DayRef[]) => new Set(days.map((d) => d.dayIndex)).size;

/** Week the cycle is in: the current day's week, the last week once full. */
export function currentWeek(days: readonly DayRef[], today: string): number {
  const day = currentDayIndex(days, today);
  return day === null ? PROGRAM.length : weekOf(day);
}

/** Cycles are numbered in creation order: "Cycle 1", "Cycle 2"… */
export function cycleNumbers(
  cycles: readonly { id: string; startDate: string; createdAt?: string | null }[],
): Map<string, number> {
  const key = (c: (typeof cycles)[number]) => c.createdAt ?? c.startDate;
  const sorted = [...cycles].sort((a, b) => key(a).localeCompare(key(b)) || a.id.localeCompare(b.id));
  return new Map(sorted.map((c, i) => [c.id, i + 1]));
}
