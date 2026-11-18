/**
 * Which evenings get the carnet reminder. Pure, covered by evenings.test.ts.
 *
 * Reminders are scheduled one by one for the coming days (not as a daily repeat,
 * which cannot skip a day): tonight is skipped once the day is filled, and the
 * series stops by itself if the app is not opened for a week.
 */
import { TOTAL_DAYS, filledDays, localDate, type DayRef } from '@/core/cycle';

export interface ReminderTime {
  hour: number;
  minute: number;
}

export const DEFAULT_REMINDER_TIME: ReminderTime = { hour: 21, minute: 0 };

/** Evenings scheduled ahead; opening the app pushes the window forward. */
export const DAYS_AHEAD = 7;

/** "21:00" ↔ { hour: 21, minute: 0 } */
export const formatReminderTime = ({ hour, minute }: ReminderTime) =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

export function parseReminderTime(value: string | null | undefined): ReminderTime {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value ?? '');
  if (!m) return DEFAULT_REMINDER_TIME;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  return hour < 24 && minute < 60 ? { hour, minute } : DEFAULT_REMINDER_TIME;
}

/** Moves the time by `minutes`, wrapping around midnight. */
export function shiftReminderTime({ hour, minute }: ReminderTime, minutes: number): ReminderTime {
  const total = (((hour * 60 + minute + minutes) % 1440) + 1440) % 1440;
  return { hour: Math.floor(total / 60), minute: total % 60 };
}

/**
 * The evenings to remind, given the days of the cycle in progress (none: no cycle).
 * No more reminders than days left to fill.
 */
export function reminderEvenings(days: readonly DayRef[] | null, time: ReminderTime, now = new Date()): Date[] {
  if (!days) return [];
  const today = localDate(now);
  const todayFilled = days.some((d) => d.date === today);
  // Days left to fill, today's excluded when it is already filled.
  const left = TOTAL_DAYS - filledDays(days);
  const out: Date[] = [];
  for (let i = todayFilled ? 1 : 0; i < DAYS_AHEAD && out.length < left; i++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, time.hour, time.minute);
    if (at > now) out.push(at);
  }
  return out;
}
