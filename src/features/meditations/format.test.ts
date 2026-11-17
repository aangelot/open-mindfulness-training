import { formatClock, formatDuration, parseTime, thisWeek } from './format';
import type { MeditationSession } from './store';

describe('meditation formats', () => {
  it('formats clocks and durations', () => {
    expect(formatClock(125)).toBe('2:05');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatDuration(1800)).toBe('30 min');
    expect(formatDuration(4500)).toBe('1 h 15');
    expect(formatDuration(7200)).toBe('2 h');
  });

  it('reads start times written in the usual French ways', () => {
    expect(parseTime('07:30')).toEqual([7, 30]);
    expect(parseTime('7h30')).toEqual([7, 30]);
    expect(parseTime('7h')).toEqual([7, 0]);
    expect(parseTime('18.05')).toEqual([18, 5]);
    expect(parseTime('24:00')).toBeNull();
    expect(parseTime('7:75')).toBeNull();
    expect(parseTime('')).toBeNull();
  });

  it('counts the sessions of the current week, from Monday', () => {
    const at = (iso: string, seconds: number) => ({ startedAt: new Date(iso).toISOString(), durationSeconds: seconds }) as MeditationSession;
    // Wednesday 18 November 2026.
    const now = new Date(2026, 10, 18, 12);
    const sessions = [at('2026-11-16T07:00', 1200), at('2026-11-18T06:00', 1800), at('2026-11-15T20:00', 600)];
    expect(thisWeek(sessions, now)).toEqual({ count: 2, seconds: 3000 });
  });
});
