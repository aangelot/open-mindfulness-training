import { PROGRAM, weekSittingSessions } from '@/core/program';

import { practiceClips } from './practice-audio';
import { SITTING_SESSIONS, TARGET_MINUTES, composeSitting, sittingPlan } from './sitting-sessions';

const labels = { title: 't', subtitle: 's', intro: 'intro', conclusion: 'conclusion' };

describe('sitting sessions', () => {
  it('cover the eight weeks, week 5 twice', () => {
    expect(SITTING_SESSIONS.map((s) => s.week)).toEqual([1, 2, 3, 4, 5, 5, 6, 7, 8]);
    expect(new Set(SITTING_SESSIONS.map((s) => s.id)).size).toBe(SITTING_SESSIONS.length);
  });

  it('match the ids other screens link to', () => {
    for (const week of PROGRAM.map((w) => w.week)) {
      const defs = SITTING_SESSIONS.filter((s) => s.week === week).map(({ id, group }) => (group ? { id, group } : { id }));
      expect(defs).toEqual(weekSittingSessions(week));
    }
  });

  it('only use practices of their week', () => {
    for (const def of SITTING_SESSIONS) {
      const refs = PROGRAM[def.week - 1].sitting.steps.flatMap((s) => s.refs);
      for (const step of def.steps) expect(refs).toContain(step.ref);
    }
  });

  it('have a guide for every voiced step, except P29 which has no audio', () => {
    for (const def of SITTING_SESSIONS) {
      for (const step of def.steps) {
        if (step.silent) continue;
        if (step.ref === 'P29') expect(practiceClips(step.ref)).toBeNull();
        else expect(practiceClips(step.ref)).not.toBeNull();
      }
    }
  });

  const cases = SITTING_SESSIONS.flatMap((def) => TARGET_MINUTES.map((minutes) => [def.id, minutes] as const));

  it.each(cases)('%s in %i min lasts exactly that long, with silent practice time', (id, minutes) => {
    const def = SITTING_SESSIONS.find((s) => s.id === id)!;
    const session = composeSitting(def, minutes, practiceClips);
    expect(Math.abs(session.totalSeconds - minutes * 60)).toBeLessThan(1);
    // Some silent practice is left (étape 2 in 20 min, the tightest, keeps about a fifth).
    const silence = session.steps.reduce((sum, s) => sum + s.silenceSeconds, 0);
    const voice = session.steps.reduce((sum, s) => sum + s.guideSeconds, 0);
    expect(silence / (silence + voice)).toBeGreaterThan(0.15);
    for (const s of session.steps) expect(s.silenceSeconds).toBeGreaterThanOrEqual(0);
  });

  it('build a playlist matching the composition', () => {
    const def = SITTING_SESSIONS.find((s) => s.id === 'etape-5-pensees')!;
    const session = composeSitting(def, 30, practiceClips);
    const plan = sittingPlan(session, practiceClips, labels);
    expect(plan.parts.map((p) => p.ref ?? p.label)).toEqual(['E6', 'P8', 'P9', 'P31', 'P29', 'P30', 'conclusion']);
    // P29 has no audio: a labelled silence.
    expect(plan.parts[4]).toMatchObject({ silent: true, items: [{ kind: 'bell' }, { kind: 'silence' }] });
    // The session ends on a bell.
    expect(plan.parts.at(-1)!.items.at(-1)).toEqual({ kind: 'bell' });
  });

  it('put the silent practice before the dedication of P42', () => {
    const def = SITTING_SESSIONS.find((s) => s.id === 'etape-7')!;
    const plan = sittingPlan(composeSitting(def, 30, practiceClips), practiceClips, labels);
    expect(plan.parts).toHaveLength(1);
    expect(plan.parts[0].items.map((i) => i.kind)).toEqual(['bell', 'guide', 'silence', 'outro', 'bell']);
  });
});
