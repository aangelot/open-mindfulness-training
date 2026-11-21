/**
 * The "pratiques types" of the eight steps, as guided sessions.
 *
 * There is no dedicated recording: a session chains the practices of the step
 * (the book's own audios, cut by scripts/audio-pack), each one given the
 * minutes the book plans for it. A bell marks every change. Two versions:
 *   - full: the guidance of each practice, then silent practice time;
 *   - light: only the announcement of each practice (its first words), then silence.
 *
 * Some guidances are longer than the minutes the book plans (P9: 3 min of
 * guidance for a 1-minute step): in the full version, those steps last as long
 * as their guidance. The light version always lasts what the book says.
 */
import { BELL_SECONDS } from '@/core/audio/sound-lengths';
import type { SessionItem, SessionPart, SessionPlan } from '@/core/audio/types';
import { PROGRAM, SESSION_CONCLUSION, SESSION_INTRO, type PracticeRef } from '@/core/program';

/** Stored in meditation_sessions.content_ref: never rename. */
export const SITTING_VERSIONS = ['full', 'light'] as const;
export type SittingVersion = (typeof SITTING_VERSIONS)[number];

/**
 * Where the book gives a range ("10 à 15 min") or alternatives (week 8: five or
 * eight points), the session comes in a short and a long length.
 * Stored in meditation_sessions.content_ref: never rename.
 */
export const SITTING_LENGTHS = ['short', 'long'] as const;
export type SittingLength = (typeof SITTING_LENGTHS)[number];

export interface SittingOptions {
  version: SittingVersion;
  length: SittingLength;
}

interface StepDef {
  ref: PracticeRef;
  /** Only in this length (week 8: the five points when short, the eight points when long). */
  only?: SittingLength;
  /** No guidance: the step is a labelled silence (P9 after week 1: settling into the posture). */
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

const P8 = { ref: 'P8' } satisfies StepDef;
/** The posture has been learned in week 1: afterwards, one silent minute to settle in. */
const P9_SILENT = { ref: 'P9', silent: true } satisfies StepDef;

export const SITTING_SESSIONS: SittingSessionDef[] = [
  {
    id: 'etape-1',
    week: 1,
    steps: [
      { ref: 'P6' },
      P8,
      { ref: 'P9' },
      { ref: 'P5' },
      { ref: 'P10' },
      { ref: 'P7' },
    ],
  },
  {
    id: 'etape-2',
    week: 2,
    steps: [P8, P9_SILENT, { ref: 'P11' }, { ref: 'P13' }, { ref: 'P14' }, { ref: 'P16' }],
  },
  {
    id: 'etape-3',
    week: 3,
    steps: [P8, P9_SILENT, { ref: 'P19' }, { ref: 'P20' }, { ref: 'P21' }, { ref: 'P23' }],
  },
  {
    id: 'etape-4',
    week: 4,
    steps: [P8, P9_SILENT, { ref: 'P19' }, { ref: 'P26' }, { ref: 'P28' }],
  },
  {
    id: 'etape-5-pensees',
    week: 5,
    group: 'pensees',
    steps: [P8, P9_SILENT, { ref: 'P31' }, { ref: 'P29' }, { ref: 'P30' }],
  },
  {
    id: 'etape-5-emotions',
    week: 5,
    group: 'emotions',
    steps: [P8, P9_SILENT, { ref: 'P32' }, { ref: 'P34' }, { ref: 'P33' }],
  },
  {
    id: 'etape-6',
    week: 6,
    steps: [P8, P9_SILENT, { ref: 'P36' }, { ref: 'P37' }, { ref: 'P38' }, { ref: 'P39' }],
  },
  {
    id: 'etape-7',
    week: 7,
    selfContained: true,
    steps: [{ ref: 'P42' }],
  },
  {
    id: 'etape-8',
    week: 8,
    selfContained: true,
    // "La méditation essentielle en huit points ou en cinq points" (20 to 30 min): five when short.
    steps: [P8, P9_SILENT, { ref: 'P43', only: 'short' }, { ref: 'P42', only: 'long' }],
  },
];

export const getSittingSession = (id: string) => SITTING_SESSIONS.find((s) => s.id === id);

// --- Composition ------------------------------------------------------------

/** Audio of a practice, as cut by scripts/audio-pack. */
export interface PracticeClips {
  url: string;
  guideSeconds: number;
  outroSeconds?: number;
  titleSeconds?: number;
}

export interface ComposedStep {
  ref: PracticeRef;
  title: string;
  /** Minutes the book plans for the step, in seconds (its bell included). */
  plannedSeconds: number;
  /** What is heard at the start: the guidance, the announcement only, or nothing. */
  voice: 'guide' | 'title' | null;
  /** Voice, silence, then the spoken conclusion (P42, P43), in seconds (bell excluded). */
  voiceSeconds: number;
  silenceSeconds: number;
  outroSeconds: number;
}

export interface ComposedSession {
  def: SittingSessionDef;
  options: SittingOptions;
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

/** Minutes the book plans for a step: the low end of a range when short, the high end when long. */
const plannedSeconds = (minutes: number | readonly [number, number], length: SittingLength) =>
  60 * (typeof minutes === 'number' ? minutes : length === 'short' ? minutes[0] : minutes[1]);

/** Whether the book leaves a choice of length for this session (a range or alternatives). */
export const hasLengths = (def: SittingSessionDef) =>
  def.steps.some((s) => s.only !== undefined || typeof programStep(def.week, s.ref).minutes !== 'number');

/**
 * Lays out a session. Every part (introduction, practices, conclusion) lasts the
 * minutes the book plans for it, its opening bell included; the guidance of
 * the full version is never cut, so a step whose guidance is longer than
 * planned gets no silence and lasts longer. A last bell closes the session.
 */
export function composeSitting(
  def: SittingSessionDef,
  options: SittingOptions,
  clipsOf: (ref: PracticeRef) => PracticeClips | null,
): ComposedSession {
  const steps = def.steps
    .filter((s) => (s.only ?? options.length) === options.length)
    .map((s): ComposedStep => {
      const clips = clipsOf(s.ref);
      const planned = programStep(def.week, s.ref);
      // The light version announces every practice that has an audio, P9 included.
      const voice = options.version === 'light' ? (clips?.titleSeconds ? 'title' : null) : clips && !s.silent ? 'guide' : null;
      const voiceSeconds = voice === 'title' ? clips!.titleSeconds! : voice === 'guide' ? clips!.guideSeconds : 0;
      const outroSeconds = voice ? (clips?.outroSeconds ?? 0) : 0;
      const plannedTotal = plannedSeconds(planned.minutes, options.length);
      const silenceSeconds = Math.max(0, Math.round(plannedTotal - BELL_SECONDS - voiceSeconds - outroSeconds));
      return { ref: s.ref, title: planned.title, plannedSeconds: plannedTotal, voice, voiceSeconds, silenceSeconds, outroSeconds };
    });

  const introSeconds = def.selfContained ? 0 : SESSION_INTRO.minutes * 60 - BELL_SECONDS;
  const conclusionSeconds = def.selfContained ? 0 : SESSION_CONCLUSION.minutes * 60 - BELL_SECONDS;
  const bells = (steps.length + (def.selfContained ? 0 : 2) + 1) * BELL_SECONDS;
  const totalSeconds =
    introSeconds + conclusionSeconds + bells + steps.reduce((sum, s) => sum + s.voiceSeconds + s.silenceSeconds + s.outroSeconds, 0);
  return { def, options, steps, introSeconds, conclusionSeconds, totalSeconds };
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
    const url = step.voice ? clipsOf(step.ref)?.url : undefined;
    const items: SessionItem[] = [bell];
    if (url && step.voice) items.push({ kind: step.voice, url });
    items.push({ kind: 'silence', seconds: step.silenceSeconds });
    // The spoken conclusion comes after the silent practice.
    if (url && step.outroSeconds > 0) items.push({ kind: 'outro', url });
    parts.push({ label: step.title, ref: step.ref, silent: step.voice !== 'guide', items });
  }
  if (session.conclusionSeconds > 0) {
    parts.push({ label: labels.conclusion, silent: true, items: [bell, { kind: 'silence', seconds: session.conclusionSeconds }] });
  }
  parts[parts.length - 1].items.push(bell);
  return { title: labels.title, subtitle: labels.subtitle, parts };
}
