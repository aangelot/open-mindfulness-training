import {
  calendarLevel,
  calendarWeekCount,
  mondayOf,
  practiceCalendar,
  scoreRating,
  secondsByDay,
  streaks,
  topCounts,
  weeklyRatingAverages,
  weeklyTotals,
} from './stats';

/** Local date-time, so the tests do not depend on the machine's time zone. */
const at = (y: number, m: number, d: number, h = 8) => new Date(y, m - 1, d, h);
const session = (date: Date, minutes: number) => ({ startedAt: date.toISOString(), durationSeconds: minutes * 60 });

// Wednesday 18 November 2026
const today = at(2026, 11, 18, 12);

describe('secondsByDay', () => {
  it('adds the sessions of a same local day', () => {
    const days = secondsByDay([session(at(2026, 11, 18, 7), 20), session(at(2026, 11, 18, 21), 10), session(at(2026, 11, 17), 5)]);
    expect(days.get('2026-11-18')).toBe(1800);
    expect(days.get('2026-11-17')).toBe(300);
  });
});

describe('streaks', () => {
  const days = (...keys: string[]) => new Set(keys);

  it('counts the run ending today', () => {
    expect(streaks(days('2026-11-16', '2026-11-17', '2026-11-18'), today)).toEqual({ current: 3, best: 3 });
  });

  it('keeps the run alive until the end of today', () => {
    expect(streaks(days('2026-11-16', '2026-11-17'), today).current).toBe(2);
  });

  it('breaks after a day without practice', () => {
    expect(streaks(days('2026-11-15', '2026-11-16'), today).current).toBe(0);
  });

  it('finds the best run, across months', () => {
    const s = streaks(days('2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-10', '2026-11-18'), today);
    expect(s).toEqual({ current: 1, best: 4 });
  });

  it('is zero without practice', () => {
    expect(streaks(days(), today)).toEqual({ current: 0, best: 0 });
  });
});

describe('weeklyTotals', () => {
  it('sums each Monday–Sunday week, the current one last', () => {
    const byDay = secondsByDay([session(at(2026, 11, 16), 10), session(at(2026, 11, 15), 20), session(at(2026, 11, 9), 30)]);
    const weeks = weeklyTotals(byDay, 3, today);
    expect(weeks).toEqual([
      { start: '2026-11-02', seconds: 0 },
      { start: '2026-11-09', seconds: 50 * 60 },
      { start: '2026-11-16', seconds: 10 * 60 },
    ]);
  });
});

describe('practiceCalendar', () => {
  it('lays weeks out Monday first and leaves the days after today empty', () => {
    const cal = practiceCalendar(secondsByDay([session(at(2026, 11, 17), 20)]), 2, today);
    expect(cal).toHaveLength(2);
    expect(cal[0][0].date).toBe('2026-11-09');
    expect(cal[1][1]).toEqual({ date: '2026-11-17', seconds: 1200, level: 2 });
    expect(cal[1][2].level).toBe(0); // today, nothing yet
    expect(cal[1][3].level).toBeNull(); // tomorrow
  });

  it('goes back to the week of the first session', () => {
    expect(calendarWeekCount(new Map(), 20, today)).toBe(20);
    expect(calendarWeekCount(secondsByDay([session(at(2026, 11, 2), 5)]), 20, today)).toBe(20);
    // Monday 3 March 2025 → Monday 16 November 2026: 89 weeks apart, 90 columns.
    const byDay = secondsByDay([session(at(2026, 11, 17), 5), session(at(2025, 3, 5), 5)]);
    expect(calendarWeekCount(byDay, 20, today)).toBe(90);
  });

  it('grades the days by minutes', () => {
    expect([0, 30, 60, 14 * 60, 15 * 60, 30 * 60, 45 * 60, 90 * 60].map(calendarLevel)).toEqual([0, 1, 1, 1, 2, 3, 4, 4]);
  });
});

describe('mondayOf', () => {
  it('goes back to Monday, Sunday included', () => {
    expect(mondayOf(at(2026, 11, 22)).getDate()).toBe(16);
    expect(mondayOf(at(2026, 11, 16)).getDate()).toBe(16);
  });
});

describe('carnet', () => {
  it('averages the reminder ratings per week', () => {
    const avg = weeklyRatingAverages([
      { dayIndex: 0, rating: 'A' },
      { dayIndex: 6, rating: 'C' },
      { dayIndex: 14, rating: 'E' },
      { dayIndex: 70, rating: 'E' },
    ]);
    expect(avg).toEqual([2, null, 5, null, null, null, null, null]);
    expect(scoreRating(2.4)).toBe('B');
    expect(scoreRating(4.5)).toBe('E');
  });

  it('ranks obstacles by the number of days they appear', () => {
    expect(topCounts([['oubli', 'agitation'], ['oubli', 'oubli'], ['torpeur']], 2)).toEqual([
      { id: 'oubli', count: 2 },
      { id: 'agitation', count: 1 },
    ]);
  });
});
