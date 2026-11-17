import book from '@/content/generated/book.json';

import { OBSTACLES, OBSTACLES_REF, PROGRAM, REMEDIES, SESSION_INTRO } from './program';

describe('8-week program', () => {
  it('has the 8 weeks in order', () => {
    expect(PROGRAM.map((w) => w.week)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('gives every week an instant reminder, a short pause and the three daily situations', () => {
    for (const week of PROGRAM) {
      const ids = week.reminders.map((r) => r.id);
      expect(week.reminders.some((r) => r.category === 'instantane')).toBe(true);
      expect(week.reminders.some((r) => r.category === 'petite_pause')).toBe(true);
      expect(ids).toEqual(expect.arrayContaining(['matin-intention', 'midi-repas', 'soir-bilan']));
    }
  });

  it('never repeats a reminder id within a week (ratings are keyed by it)', () => {
    for (const week of PROGRAM) {
      const ids = week.reminders.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('references only practices from the book (P5–P43)', () => {
    for (const week of PROGRAM) {
      for (const step of week.sitting.steps) {
        for (const ref of step.refs) expect(Number(ref.slice(1))).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it('links only to sections that exist in the book', () => {
    const refs = new Set(book.parts.flatMap((p) => p.sections.map((s) => s.ref)));
    const wanted = [SESSION_INTRO.ref, OBSTACLES_REF, ...PROGRAM.flatMap((w) => w.sitting.steps.flatMap((s) => s.refs))];
    expect(wanted.filter((r) => !refs.has(r))).toEqual([]);
  });

  it('maps every remedy to one of the six obstacles (E8)', () => {
    expect(OBSTACLES).toHaveLength(6);
    expect(REMEDIES).toHaveLength(9);
    const ids = new Set<string>(OBSTACLES.map((o) => o.id));
    for (const r of REMEDIES) expect(ids.has(r.obstacle)).toBe(true);
  });
});
