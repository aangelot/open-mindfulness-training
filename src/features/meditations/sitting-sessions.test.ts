import { PROGRAM, SESSION_CONCLUSION, SESSION_INTRO, weekSittingSessions } from '@/core/program';

import { practiceClips } from './practice-audio';
import { BELL_SECONDS } from '@/core/audio/sound-lengths';

import {
  SITTING_LENGTHS,
  SITTING_SESSIONS,
  SITTING_VERSIONS,
  composeSitting,
  hasLengths,
  sittingPlan,
  type SittingOptions,
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

  it('offer a short and a long length where the book gives a range or alternatives', () => {
    expect(SITTING_SESSIONS.filter(hasLengths).map((d) => d.id)).toEqual(['etape-2', 'etape-8']);
  });

  const full = (length: SittingOptions['length'] = 'short'): SittingOptions => ({ version: 'full', length });
  const light = (length: SittingOptions['length'] = 'short'): SittingOptions => ({ version: 'light', length });

  /** Minutes the book plans for a session, introduction and conclusion included. */
  const bookMinutes = (id: string, length: SittingOptions['length']) => {
    const def = SITTING_SESSIONS.find((s) => s.id === id)!;
    const steps = PROGRAM[def.week - 1].sitting.steps.filter((step) =>
      def.steps.some((s) => step.refs.includes(s.ref) && (s.only ?? length) === length),
    );
    const generic = def.selfContained ? 0 : SESSION_INTRO.minutes + SESSION_CONCLUSION.minutes;
    return generic + steps.reduce((sum, s) => sum + (typeof s.minutes === 'number' ? s.minutes : length === 'short' ? s.minutes[0] : s.minutes[1]), 0);
  };

  const cases = SITTING_SESSIONS.flatMap((def) => SITTING_LENGTHS.map((length) => [def.id, length] as const));

  it.each(cases)('%s (%s), light, lasts what the book plans', (id, length) => {
    const def = SITTING_SESSIONS.find((s) => s.id === id)!;
    const session = composeSitting(def, light(length), practiceClips);
    // Plus the closing bell; silences are whole seconds.
    expect(Math.abs(session.totalSeconds - (bookMinutes(id, length) * 60 + BELL_SECONDS))).toBeLessThan(1);
    for (const s of session.steps) {
      expect(s.voice).toBe(s.ref === 'P29' ? null : 'title');
      expect(s.silenceSeconds).toBeGreaterThan(0);
    }
  });

  it.each(cases)('%s (%s), full, gives every step its planned time or its whole guidance', (id, length) => {
    const def = SITTING_SESSIONS.find((s) => s.id === id)!;
    const session = composeSitting(def, full(length), practiceClips);
    expect(session.totalSeconds).toBeGreaterThanOrEqual(bookMinutes(id, length) * 60);
    for (const s of session.steps) {
      const lasts = BELL_SECONDS + s.voiceSeconds + s.silenceSeconds + s.outroSeconds;
      expect(Math.abs(lasts - Math.max(s.plannedSeconds, BELL_SECONDS + s.voiceSeconds + s.outroSeconds))).toBeLessThan(1);
    }
  });

  it('give week 1 the whole of its practices, and week 8 five points when short, eight when long', () => {
    const refs = (id: string, options: SittingOptions) =>
      composeSitting(SITTING_SESSIONS.find((s) => s.id === id)!, options, practiceClips).steps.map((s) => s.ref);
    expect(refs('etape-1', full())).toEqual(['P6', 'P8', 'P9', 'P5', 'P10', 'P7']);
    expect(refs('etape-8', full('short'))).toEqual(['P8', 'P9', 'P43']);
    expect(refs('etape-8', full('long'))).toEqual(['P8', 'P9', 'P42']);
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
    const plan = sittingPlan(composeSitting(def, { version, length: 'short' }, practiceClips), practiceClips, labels);
    expect(plan.parts).toHaveLength(1);
    expect(plan.parts[0].items.map((i) => i.kind)).toEqual(['bell', version === 'full' ? 'guide' : 'title', 'silence', 'outro', 'bell']);
  });
});
