import { PROGRAM, weekSittingSessions } from '@/core/program';

import { practiceClips } from './practice-audio';
import {
  SITTING_SESSIONS,
  SITTING_VERSIONS,
  TARGET_MINUTES,
  composeSitting,
  sittingPlan,
  type SittingOptions,
  type TargetMinutes,
} from './sitting-sessions';

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

  it('have a guide and a title for every step with audio, except P29 which has none', () => {
    for (const def of SITTING_SESSIONS) {
      for (const step of def.steps) {
        if (step.ref === 'P29') expect(practiceClips(step.ref)).toBeNull();
        else expect(practiceClips(step.ref)).toMatchObject({ guideSeconds: expect.any(Number), titleSeconds: expect.any(Number) });
      }
    }
  });

  const full = (minutes: TargetMinutes = 30): SittingOptions => ({ version: 'full', minutes });
  const light = (minutes: TargetMinutes = 30): SittingOptions => ({ version: 'light', minutes });

  const cases = SITTING_SESSIONS.flatMap((def) =>
    SITTING_VERSIONS.flatMap((version) => TARGET_MINUTES.map((minutes) => [def.id, version, minutes] as const)),
  );

  it.each(cases)('%s (%s) in %i min lasts exactly that long, with silent practice time', (id, version, minutes) => {
    const def = SITTING_SESSIONS.find((s) => s.id === id)!;
    const session = composeSitting(def, { version, minutes }, practiceClips);
    expect(Math.abs(session.totalSeconds - minutes * 60)).toBeLessThan(1);
    // Some silent practice is left (étape 2 in 20 min, the tightest, keeps about a fifth).
    const silence = session.steps.reduce((sum, s) => sum + s.silenceSeconds, 0);
    const voice = session.steps.reduce((sum, s) => sum + s.voiceSeconds + s.outroSeconds, 0);
    expect(silence / (silence + voice)).toBeGreaterThan(0.15);
    for (const s of session.steps) expect(s.silenceSeconds).toBeGreaterThanOrEqual(0);
  });

  it.each(TARGET_MINUTES)('keep every practice in the light version, in %i min', (minutes) => {
    for (const def of SITTING_SESSIONS) {
      const steps = composeSitting(def, light(minutes), practiceClips).steps;
      const expected = def.steps.filter((s) => (s.only ?? TARGET_MINUTES).includes(minutes)).map((s) => s.ref);
      expect(steps.map((s) => s.ref)).toEqual(expected);
      for (const s of steps) expect(s.voice).toBe(s.ref === 'P29' ? null : 'title');
    }
  });

  it('share the light version in proportion to the book', () => {
    // Étape 4: P26 and P28 are planned 10 min each, P19 5 min.
    const steps = composeSitting(SITTING_SESSIONS.find((s) => s.id === 'etape-4')!, light(40), practiceClips).steps;
    const time = (ref: string) => steps.find((s) => s.ref === ref)!;
    const lasts = (ref: string) => time(ref).voiceSeconds + time(ref).silenceSeconds;
    expect(Math.abs(lasts('P26') - lasts('P28'))).toBeLessThan(2);
    expect(Math.abs(lasts('P26') / lasts('P19') - 2)).toBeLessThan(0.02);
  });

  it('play the five points in 20 min and the eight points in 30 and 40 min (étape 8)', () => {
    const def = SITTING_SESSIONS.find((s) => s.id === 'etape-8')!;
    for (const version of SITTING_VERSIONS) {
      const refs = (minutes: TargetMinutes) => composeSitting(def, { version, minutes }, practiceClips).steps.map((s) => s.ref);
      expect(refs(20)).toContain('P43');
      expect(refs(20)).not.toContain('P42');
      expect(refs(40)).toContain('P42');
      expect(refs(40)).not.toContain('P43');
    }
  });

  it('build a playlist matching the composition', () => {
    const def = SITTING_SESSIONS.find((s) => s.id === 'etape-5-pensees')!;
    const session = composeSitting(def, full(), practiceClips);
    const plan = sittingPlan(session, practiceClips, labels);
    expect(plan.parts.map((p) => p.ref ?? p.label)).toEqual(['E6', 'P8', 'P9', 'P31', 'P29', 'P30', 'conclusion']);
    // After week 1, P9 is a silent minute in the full version.
    expect(plan.parts[2]).toMatchObject({ silent: true, items: [{ kind: 'bell' }, { kind: 'silence' }] });
    // P29 has no audio: a labelled silence.
    expect(plan.parts[4]).toMatchObject({ silent: true, items: [{ kind: 'bell' }, { kind: 'silence' }] });
    expect(plan.parts[3].items.map((i) => i.kind)).toEqual(['bell', 'guide', 'silence']);
    // The session ends on a bell.
    expect(plan.parts.at(-1)!.items.at(-1)).toEqual({ kind: 'bell' });
  });

  it('announce every practice with audio in the light version, P9 included', () => {
    const def = SITTING_SESSIONS.find((s) => s.id === 'etape-5-pensees')!;
    const plan = sittingPlan(composeSitting(def, light(), practiceClips), practiceClips, labels);
    expect(plan.parts.slice(1, -1).map((p) => p.items.map((i) => i.kind).join(' '))).toEqual([
      'bell title silence',
      'bell title silence',
      'bell title silence',
      'bell silence',
      'bell title silence',
    ]);
  });

  it.each(SITTING_VERSIONS)('put the silent practice before the dedication of P42 (%s)', (version) => {
    const def = SITTING_SESSIONS.find((s) => s.id === 'etape-7')!;
    const plan = sittingPlan(composeSitting(def, { version, minutes: 30 }, practiceClips), practiceClips, labels);
    expect(plan.parts).toHaveLength(1);
    expect(plan.parts[0].items.map((i) => i.kind)).toEqual(['bell', version === 'full' ? 'guide' : 'title', 'silence', 'outro', 'bell']);
  });
});
