/**
 * The "pratiques types" of the eight steps, as guided sessions of 20, 30 or 40 minutes.
 *
 * There is no dedicated recording: a session chains the guided part of each
 * practice of the step (the book's own audios, cut by scripts/audio-pack) and
 * gives each one silent practice time, in proportion to the minutes the book
 * plans for it. A bell marks every change.
 *
 * The recordings are longer than the minutes the book plans (P9: 4 min of
 * guidance for a 1-minute step), so the shorter sessions leave some practices
 * out: `at` lists the durations that include a step. A test checks every
 * session fits its duration.
 */
import { BELL_SECONDS } from '@/core/audio/sound-lengths';
import type { SessionItem, SessionPart, SessionPlan } from '@/core/audio/types';
import { PROGRAM, SESSION_CONCLUSION, SESSION_INTRO, type PracticeRef } from '@/core/program';

export const TARGET_MINUTES = [20, 30, 40] as const;
export type TargetMinutes = (typeof TARGET_MINUTES)[number];

const ALL = TARGET_MINUTES;
const LONG = [30, 40] as const;

interface StepDef {
  ref: PracticeRef;
  at: readonly TargetMinutes[];
  /** Plays no audio: the step is a labelled silence (P9 after week 1: settling into the posture). */
  silent?: boolean;
}

export interface SittingSessionDef {
  /** Stable id: stored in meditation_sessions.content_ref. Never rename. */
  id: string;
  week: number;
  /** Week 5 has two trainings. */
  group?: 'pensees' | 'emotions';
  /**
   * P42 and P43 carry their own introduction (motivation) and conclusion
   * (dedication): no generic introduction and conclusion around them.
   */
  selfContained?: boolean;
  steps: StepDef[];
}

const P8 = { ref: 'P8', at: LONG } satisfies StepDef;
/** The posture has been learned in week 1: afterwards, one silent minute to settle in. */
const P9_SILENT = { ref: 'P9', at: ALL, silent: true } satisfies StepDef;

export const SITTING_SESSIONS: SittingSessionDef[] = [
  {
    id: 'etape-1',
    week: 1,
    steps: [
      { ref: 'P6', at: LONG },
      P8,
      { ref: 'P9', at: LONG },
      { ref: 'P5', at: ALL },
      { ref: 'P10', at: ALL },
      { ref: 'P7', at: ALL },
    ],
  },
  {
    id: 'etape-2',
    week: 2,
    steps: [P8, P9_SILENT, { ref: 'P11', at: ALL }, { ref: 'P13', at: ALL }, { ref: 'P14', at: ALL }, { ref: 'P16', at: ALL }],
  },
  {
    id: 'etape-3',
    week: 3,
    steps: [P8, P9_SILENT, { ref: 'P19', at: ALL }, { ref: 'P20', at: ALL }, { ref: 'P21', at: LONG }, { ref: 'P23', at: [40] }],
  },
  {
    id: 'etape-4',
    week: 4,
    steps: [P8, P9_SILENT, { ref: 'P19', at: LONG }, { ref: 'P26', at: ALL }, { ref: 'P28', at: ALL }],
  },
  {
    id: 'etape-5-pensees',
    week: 5,
    group: 'pensees',
    steps: [P8, P9_SILENT, { ref: 'P31', at: ALL }, { ref: 'P29', at: ALL }, { ref: 'P30', at: ALL }],
  },
  {
    id: 'etape-5-emotions',
    week: 5,
    group: 'emotions',
    steps: [P8, P9_SILENT, { ref: 'P32', at: ALL }, { ref: 'P34', at: LONG }, { ref: 'P33', at: [40] }],
  },
  {
    id: 'etape-6',
    week: 6,
    steps: [P8, P9_SILENT, { ref: 'P36', at: [40] }, { ref: 'P37', at: ALL }, { ref: 'P38', at: ALL }, { ref: 'P39', at: LONG }],
  },
  {
    id: 'etape-7',
    week: 7,
    selfContained: true,
    steps: [{ ref: 'P42', at: ALL }],
  },
  {
    id: 'etape-8',
    week: 8,
    selfContained: true,
    // "La méditation essentielle en huit points ou en cinq points": the shorter one for 20 minutes.
    steps: [P8, P9_SILENT, { ref: 'P43', at: [20] }, { ref: 'P42', at: LONG }],
  },
];

export const getSittingSession = (id: string) => SITTING_SESSIONS.find((s) => s.id === id);

// --- Composition ------------------------------------------------------------

/** Audio of a practice, as cut by scripts/audio-pack. */
export interface PracticeClips {
  url: string;
  guideSeconds: number;
  outroSeconds?: number;
}

export interface ComposedStep {
  ref: PracticeRef;
  title: string;
  guided: boolean;
  /** Voice, then silence, in seconds (bell excluded). */
  guideSeconds: number;
  silenceSeconds: number;
}

export interface ComposedSession {
  def: SittingSessionDef;
  minutes: TargetMinutes;
  steps: ComposedStep[];
  /** Generic introduction and conclusion, 0 when the session is self-contained. */
  introSeconds: number;
  conclusionSeconds: number;
  totalSeconds: number;
}

const programStep = (week: number, ref: PracticeRef) => {
  const step = PROGRAM[week - 1].sitting.steps.find((s) => s.refs.includes(ref));
  if (!step) throw new Error(`${ref} is not in the sitting practice of week ${week}`);
  return step;
};

/** Minutes the book plans for a step; a range counts for its middle. */
const plannedSeconds = (minutes: number | readonly [number, number]) =>
  60 * (typeof minutes === 'number' ? minutes : (minutes[0] + minutes[1]) / 2);

/**
 * Lays out a session of `minutes`. Each step lasts max(its guidance, k × its planned
 * time), with k chosen so the whole session lasts exactly `minutes`: the silence
 * goes to the steps whose recording is shorter than planned. When the guidance
 * alone is too long, steps get no silence and the session runs over.
 */
export function composeSitting(
  def: SittingSessionDef,
  minutes: TargetMinutes,
  clipsOf: (ref: PracticeRef) => PracticeClips | null,
): ComposedSession {
  const steps = def.steps
    .filter((s) => s.at.includes(minutes))
    .map((s) => {
      const clips = s.silent ? null : clipsOf(s.ref);
      const voice = clips ? clips.guideSeconds + (clips.outroSeconds ?? 0) : 0;
      const planned = programStep(def.week, s.ref);
      return { ref: s.ref, title: planned.title, guided: clips !== null, voice, weight: plannedSeconds(planned.minutes) };
    });

  const introSeconds = def.selfContained ? 0 : SESSION_INTRO.minutes * 60;
  const conclusionSeconds = def.selfContained ? 0 : SESSION_CONCLUSION.minutes * 60;
  // A bell opens every part and closes the session.
  const bells = (steps.length + (def.selfContained ? 0 : 2) + 1) * BELL_SECONDS;
  const available = minutes * 60 - introSeconds - conclusionSeconds - bells;

  const length = (k: number) => steps.reduce((sum, s) => sum + Math.max(s.voice, k * s.weight), 0);
  let lo = 0;
  let hi = 10;
  for (let i = 0; i < 60; i++) {
    const k = (lo + hi) / 2;
    if (length(k) < available) lo = k;
    else hi = k;
  }
  const silences = steps.map((s) => Math.max(0, Math.round(lo * s.weight - s.voice)));
  // Rounding: put the remainder on the longest silence so the total is exact.
  const residue = Math.round(available - steps.reduce((sum, s, i) => sum + s.voice + silences[i], 0));
  const longest = silences.indexOf(Math.max(...silences));
  if (longest >= 0 && silences[longest] + residue >= 0) silences[longest] += residue;

  const composed = steps.map((s, i) => ({
    ref: s.ref,
    title: s.title,
    guided: s.guided,
    guideSeconds: s.voice,
    silenceSeconds: silences[i],
  }));
  const totalSeconds =
    introSeconds + conclusionSeconds + bells + composed.reduce((sum, s) => sum + s.guideSeconds + s.silenceSeconds, 0);
  return { def, minutes, steps: composed, introSeconds, conclusionSeconds, totalSeconds };
}

/** The playlist of a composed session. */
export function sittingPlan(
  session: ComposedSession,
  clipsOf: (ref: PracticeRef) => PracticeClips | null,
  labels: { title: string; subtitle: string; intro: string; conclusion: string },
): SessionPlan {
  const bell: SessionItem = { kind: 'bell' };
  const parts: SessionPart[] = [];
  if (session.introSeconds > 0) {
    parts.push({ label: labels.intro, ref: SESSION_INTRO.ref, silent: true, items: [bell, { kind: 'silence', seconds: session.introSeconds }] });
  }
  for (const step of session.steps) {
    const clips = step.guided ? clipsOf(step.ref) : null;
    const items: SessionItem[] = [bell];
    if (clips) items.push({ kind: 'guide', url: clips.url });
    items.push({ kind: 'silence', seconds: step.silenceSeconds });
    // The spoken conclusion comes after the silent practice.
    if (clips?.outroSeconds) items.push({ kind: 'outro', url: clips.url });
    parts.push({ label: step.title, ref: step.ref, silent: !clips, items });
  }
  if (session.conclusionSeconds > 0) {
    parts.push({ label: labels.conclusion, silent: true, items: [bell, { kind: 'silence', seconds: session.conclusionSeconds }] });
  }
  parts[parts.length - 1].items.push(bell);
  return { title: labels.title, subtitle: labels.subtitle, parts };
}
