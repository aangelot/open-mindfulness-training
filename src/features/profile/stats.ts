/**
 * Statistics computed from the local data. Pure functions, covered by stats.test.ts.
 * Days are local calendar days ("YYYY-MM-DD"); weeks start on Monday.
 */
import { localDate, parseLocalDate } from '@/core/cycle';
import { REMINDER_SCALE, type ReminderRating } from '@/core/program';

export interface SessionRef {
  startedAt: string;
  durationSeconds: number;
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Monday 00:00 (local) of the week holding `d`. */
export const mondayOf = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));

/** Seconds practised per local day. */
export function secondsByDay(sessions: readonly SessionRef[]): Map<string, number> {
  const days = new Map<string, number>();
  for (const s of sessions) {
    const day = localDate(new Date(s.startedAt));
    days.set(day, (days.get(day) ?? 0) + s.durationSeconds);
  }
  return days;
}

export interface Streaks {
  /** Consecutive days up to today, or up to yesterday when today has no session yet. */
  current: number;
  best: number;
}

export function streaks(days: ReadonlySet<string> | ReadonlyMap<string, unknown>, today = new Date()): Streaks {
  const sorted = [...days.keys()].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of sorted) {
    const d = parseLocalDate(key);
    run = prev && localDate(addDays(prev, 1)) === key ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  let current = 0;
  let cursor = days.has(localDate(today)) ? today : addDays(today, -1);
  while (days.has(localDate(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  return { current, best };
}

export interface WeekTotal {
  /** Monday of the week, YYYY-MM-DD. */
  start: string;
  seconds: number;
}

/** Practice per week over the last `count` weeks, oldest first, the current week last. */
export function weeklyTotals(byDay: ReadonlyMap<string, number>, count: number, today = new Date()): WeekTotal[] {
  const thisMonday = mondayOf(today);
  return Array.from({ length: count }, (_, i) => {
    const monday = addDays(thisMonday, (i - count + 1) * 7);
    let seconds = 0;
    for (let d = 0; d < 7; d++) seconds += byDay.get(localDate(addDays(monday, d))) ?? 0;
    return { start: localDate(monday), seconds };
  });
}

export interface CalendarDay {
  date: string;
  seconds: number;
  /** 0 = nothing, 1–4 = more and more practice; null = after today. */
  level: 0 | 1 | 2 | 3 | 4 | null;
}

/** Minutes thresholds of the calendar levels 1 to 4. */
export const CALENDAR_LEVELS = [1, 15, 30, 45] as const;

export function calendarLevel(seconds: number): 0 | 1 | 2 | 3 | 4 {
  const minutes = seconds / 60;
  let level = 0;
  for (const threshold of CALENDAR_LEVELS) if (minutes >= threshold) level += 1;
  // A session shorter than a minute (added by hand) still counts as a practised day.
  return (seconds > 0 ? Math.max(1, level) : 0) as 0 | 1 | 2 | 3 | 4;
}

/** Weeks the calendar spans: back to the week of the first session, and at least `min`. */
export function calendarWeekCount(byDay: ReadonlyMap<string, number>, min: number, today = new Date()): number {
  let first: string | null = null;
  for (const day of byDay.keys()) if (first === null || day < first) first = day;
  if (first === null) return min;
  const days = Math.round((mondayOf(today).getTime() - mondayOf(parseLocalDate(first)).getTime()) / 86_400_000);
  return Math.max(min, Math.round(days / 7) + 1);
}

/** The last `weeks` weeks as columns of 7 days (Monday first), oldest week first. */
export function practiceCalendar(byDay: ReadonlyMap<string, number>, weeks: number, today = new Date()): CalendarDay[][] {
  const todayKey = localDate(today);
  const first = addDays(mondayOf(today), -(weeks - 1) * 7);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = localDate(addDays(first, w * 7 + d));
      const seconds = byDay.get(date) ?? 0;
      return { date, seconds, level: date > todayKey ? null : calendarLevel(seconds) };
    }),
  );
}

// --- Carnet ------------------------------------------------------------------

const RATINGS = Object.keys(REMINDER_SCALE) as ReminderRating[];

/** A = 1 … E = 5. */
export const ratingScore = (rating: ReminderRating) => RATINGS.indexOf(rating) + 1;

/** Score rounded back to its letter. */
export const scoreRating = (score: number): ReminderRating =>
  RATINGS[Math.min(RATINGS.length, Math.max(1, Math.round(score))) - 1];

/** Average reminder score (1–5) per week 1–8 of a cycle; null for a week without ratings. */
export function weeklyRatingAverages(
  ratings: readonly { dayIndex: number; rating: ReminderRating }[],
  weeks = 8,
): (number | null)[] {
  const sums = Array.from({ length: weeks }, () => ({ total: 0, count: 0 }));
  for (const r of ratings) {
    const week = Math.floor(r.dayIndex / 7);
    if (week >= weeks) continue;
    sums[week].total += ratingScore(r.rating);
    sums[week].count += 1;
  }
  return sums.map((s) => (s.count ? s.total / s.count : null));
}

/** How often each id appears across the days, most frequent first. */
export function topCounts(lists: readonly (readonly string[])[], limit: number): { id: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const list of lists) for (const id of new Set(list)) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    .slice(0, limit);
}
