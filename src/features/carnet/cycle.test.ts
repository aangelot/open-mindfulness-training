import {
  TOTAL_DAYS,
  currentDayIndex,
  currentWeek,
  cycleNumbers,
  dayInWeek,
  daysOfWeek,
  filledDays,
  localDate,
  weekOf,
} from './cycle';

describe('cycle arithmetic', () => {
  it('maps day indexes to weeks and J1–J7', () => {
    expect(TOTAL_DAYS).toBe(56);
    expect([weekOf(0), weekOf(6), weekOf(7), weekOf(55)]).toEqual([1, 1, 2, 8]);
    expect([dayInWeek(0), dayInWeek(6), dayInWeek(7)]).toEqual([1, 7, 1]);
    expect(daysOfWeek(2)).toEqual([7, 8, 9, 10, 11, 12, 13]);
  });

  it('formats local dates', () => {
    expect(localDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('currentDayIndex (one day per filled day)', () => {
  it('starts at J1', () => {
    expect(currentDayIndex([], '2026-11-17')).toBe(0);
  });

  it('keeps today’s day while it is being filled', () => {
    expect(currentDayIndex([{ dayIndex: 0, date: '2026-11-17' }], '2026-11-17')).toBe(0);
  });

  it('moves to the next day on a new date, whatever the gap', () => {
    const days = [
      { dayIndex: 0, date: '2026-11-01' },
      { dayIndex: 1, date: '2026-11-02' },
    ];
    expect(currentDayIndex(days, '2026-11-15')).toBe(2);
    expect(currentWeek(days, '2026-11-15')).toBe(1);
  });

  it('returns null once the 56 days are filled', () => {
    const days = Array.from({ length: 56 }, (_, i) => ({ dayIndex: i, date: `2026-01-${i}` }));
    expect(currentDayIndex(days, '2027-01-01')).toBeNull();
    expect(currentWeek(days, '2027-01-01')).toBe(8);
    expect(filledDays(days)).toBe(56);
  });
});

describe('cycleNumbers', () => {
  it('numbers cycles by start date', () => {
    const n = cycleNumbers([
      { id: 'b', startDate: '2026-05-01' },
      { id: 'a', startDate: '2026-01-01' },
    ]);
    expect([n.get('a'), n.get('b')]).toEqual([1, 2]);
  });

  it('orders cycles started the same day by creation time', () => {
    const n = cycleNumbers([
      { id: 'a', startDate: '2026-05-01', createdAt: '2026-05-01T10:00:00.000Z' },
      { id: 'b', startDate: '2026-05-01', createdAt: '2026-05-01T09:00:00.000Z' },
    ]);
    expect([n.get('b'), n.get('a')]).toEqual([1, 2]);
  });
});
