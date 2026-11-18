import { TOTAL_DAYS } from '@/core/cycle';

import { parseReminderTime, reminderEvenings, shiftReminderTime } from './evenings';

const at = (d: number, h: number, min = 0) => new Date(2026, 10, d, h, min);
const nine = { hour: 21, minute: 0 };
const day = (dayIndex: number, date: string) => ({ dayIndex, date });

describe('reminderEvenings', () => {
  it('reminds nothing without a cycle in progress', () => {
    expect(reminderEvenings(null, nine, at(18, 12))).toEqual([]);
  });

  it('starts tonight while the day is not filled', () => {
    const evenings = reminderEvenings([day(0, '2026-11-17')], nine, at(18, 12));
    expect(evenings).toHaveLength(7);
    expect(evenings[0]).toEqual(at(18, 21));
    expect(evenings[6]).toEqual(at(24, 21));
  });

  it('skips tonight once the day is filled', () => {
    const evenings = reminderEvenings([day(0, '2026-11-17'), day(1, '2026-11-18')], nine, at(18, 12));
    expect(evenings[0]).toEqual(at(19, 21));
    expect(evenings).toHaveLength(6);
  });

  it('skips tonight once the time has passed', () => {
    expect(reminderEvenings([], nine, at(18, 21, 30))[0]).toEqual(at(19, 21));
  });

  it('stops with the last days of the cycle', () => {
    const days = Array.from({ length: TOTAL_DAYS - 2 }, (_, i) => day(i, '2026-10-01'));
    expect(reminderEvenings(days, nine, at(18, 12))).toEqual([at(18, 21), at(19, 21)]);
    const full = Array.from({ length: TOTAL_DAYS }, (_, i) => day(i, '2026-10-01'));
    expect(reminderEvenings(full, nine, at(18, 12))).toEqual([]);
  });
});

describe('reminder time', () => {
  it('parses and falls back to 21:00', () => {
    expect(parseReminderTime('20:30')).toEqual({ hour: 20, minute: 30 });
    expect(parseReminderTime('7:05')).toEqual({ hour: 7, minute: 5 });
    expect(parseReminderTime('25:00')).toEqual(nine);
    expect(parseReminderTime(null)).toEqual(nine);
  });

  it('shifts around midnight', () => {
    expect(shiftReminderTime({ hour: 23, minute: 45 }, 15)).toEqual({ hour: 0, minute: 0 });
    expect(shiftReminderTime({ hour: 0, minute: 0 }, -15)).toEqual({ hour: 23, minute: 45 });
    expect(shiftReminderTime(nine, -60)).toEqual({ hour: 20, minute: 0 });
  });
});
