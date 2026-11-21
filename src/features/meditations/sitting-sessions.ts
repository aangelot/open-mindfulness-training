/**
 * The "pratiques types" of the eight steps, as guided sessions of 20, 30 or 40 minutes.
 *
 * There is no dedicated recording: a session chains the practices of the step
 * (the book's own audios, cut by scripts/audio-pack) and gives each one silent
 * practice time, in proportion to the minutes the book plans for it. A bell
 * marks every change. Two versions:
 *   - full: the guidance of each practice, then silent practice time;
 *   - light: only the announcement of each practice (its first words), then silence.
 *
 * The guidances are longer than the minutes the book plans (P9: 3 min of
 * guidance for a 1-minute step), so the shorter full sessions leave some
 * practices out (`full` lists the durations that include a step). The light
 * version keeps every practice. A test checks every session fits its duration.
 */
import { BELL_SECONDS } from '@/core/audio/sound-lengths';
import type { SessionItem, SessionPart, SessionPlan } from '@/core/audio/types';
import { PROGRAM, SESSION_CONCLUSION, SESSION_INTRO, type PracticeRef } from '@/core/program';

export const TARGET_MINUTES = [20, 30, 40] as const;
export type TargetMinutes = (typeof TARGET_MINUTES)[number];

/** Stored in meditation_sessions.content_ref: never rename. */
export const SITTING_VERSIONS = ['full', 'light'] as const;
export type SittingVersion = (typeof SITTING_VERSIONS)[number];

export interface SittingOptions {
  version: SittingVersion;
  minutes: TargetMinutes;
}

const ALL = TARGET_MINUTES;
const LONG = [30, 40] as const;

interface StepDef {
  ref: PracticeRef;
  /** Full version: the durations that include the step (its guidance does not fit the shorter ones). Default: all. */
  full?: readonly TargetMinutes[];
  /** Both versions: the durations that include the step, when the book gives alternatives (week 8). */
  only?: readonly TargetMinutes[];
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

const P8 = { ref: 'P8', full: LONG } satisfies StepDef;
/** The posture has been learned in week 1: afterwards, one silent minute to settle in. */
const P9_SILENT = { ref: 'P9', silent: true } satisfies StepDef;

export const SITTING_SESSIONS: SittingSessionDef[] = [
  {
    id: 'etape-1',
    week: 1,
    steps: [{ ref: 'P6', full: LONG }, P8, { ref: 'P9', full: LONG }, { ref: 'P5' }, { ref: 'P10' }, { ref: 'P7' }],
  },
  {
    id: 'etape-2',
    week: 2,
    steps: [P8, P9_SILENT, { ref: 'P11' }, { ref: 'P13' }, { ref: 'P14' }, { ref: 'P16' }],
  },
  {
    id: 'etape-3',
    week: 3,
    steps: [P8, P9_SILENT, { ref: 'P19' }, { ref: 'P20' }, { ref: 'P21', full: LONG }, { ref: 'P23', full: [40] }],
  },
  {
    id: 'etape-4',
    week: 4,
    steps: [P8, P9_SILENT, { ref: 'P19', full: LONG }, { ref: 'P26' }, { ref: 'P28' }],
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
    steps: [P8, P9_SILENT, { ref: 'P32' }, { ref: 'P34', full: LONG }, { ref: 'P33', full: [40] }],
  },
  {
    id: 'etape-6',
    week: 6,
    steps: [P8, P9_SILENT, { ref: 'P36', full: [40] }, { ref: 'P37' }, { ref: 'P38' }, { ref: 'P39', full: LONG }],
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
    // "La méditation essentielle en huit points ou en cinq points": the five points in 20 minutes.
    steps: [P8, P9_SILENT, { ref: 'P43', only: [20] }, { ref: 'P42', only: LONG }],
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

/** Minutes the book plans for a step; a range counts for its middle. */
const plannedSeconds = (minutes: number | readonly [number, number]) =>
  60 * (typeof minutes === 'number' ? minutes : (minutes[0] + minutes[1]) / 2);

/** Whether a step is part of a session of these options. */
const includes = (s: StepDef, { version, minutes }: SittingOptions) =>
  (s.only ?? ALL).includes(minutes) && (version === 'light' || (s.full ?? ALL).includes(minutes));

/**
 * Lays out a session. Each step lasts max(its voice, k × its planned time), with
 * k chosen so the whole session lasts exactly `minutes`: the silence goes to the
 * steps whose voice is shorter than planned (in the light version, all of them:
 * the time is shared in proportion to the book). When the voice alone is too
 * long, steps get no silence and the session runs over.
 */
export function composeSitting(
  def: SittingSessionDef,
  options: SittingOptions,
  clipsOf: (ref: PracticeRef) => PracticeClips | null,
): ComposedSession {
  const steps = def.steps
    .filter((s) => includes(s, options))
    .map((s) => {
      const clips = clipsOf(s.ref);
      // The light version announces every practice that has an audio, P9 included.
      const voice: ComposedStep['voice'] = options.version === 'light' ? (clips?.titleSeconds ? 'title' : null) : clips && !s.silent ? 'guide' : null;
      const voiceSeconds = voice === 'title' ? clips!.titleSeconds! : voice === 'guide' ? clips!.guideSeconds : 0;
      const outroSeconds = voice ? (clips?.outroSeconds ?? 0) : 0;
      const planned = programStep(def.week, s.ref);
      return { ref: s.ref, title: planned.title, voice, voiceSeconds, outroSeconds, weight: plannedSeconds(planned.minutes) };
    });

  const introSeconds = def.selfContained ? 0 : SESSION_INTRO.minutes * 60;
  const conclusionSeconds = def.selfContained ? 0 : SESSION_CONCLUSION.minutes * 60;
  // A bell opens every part and closes the session.
  const bells = (steps.length + (def.selfContained ? 0 : 2) + 1) * BELL_SECONDS;
  const available = options.minutes * 60 - introSeconds - conclusionSeconds - bells;

  const spoken = (s: (typeof steps)[number]) => s.voiceSeconds + s.outroSeconds;
  const length = (k: number) => steps.reduce((sum, s) => sum + Math.max(spoken(s), k * s.weight), 0);
  let lo = 0;
  let hi = 10;
  for (let i = 0; i < 60; i++) {
    const k = (lo + hi) / 2;
    if (length(k) < available) lo = k;
    else hi = k;
  }
  const silences = steps.map((s) => Math.max(0, Math.round(lo * s.weight - spoken(s))));
  // Rounding: put the remainder on the longest silence so the total is exact.
  const residue = Math.round(available - steps.reduce((sum, s, i) => sum + spoken(s) + silences[i], 0));
  const longest = silences.indexOf(Math.max(...silences));
  if (longest >= 0 && silences[longest] + residue >= 0) silences[longest] += residue;

  const composed: ComposedStep[] = steps.map((s, i) => ({
    ref: s.ref,
    title: s.title,
    voice: s.voice,
    voiceSeconds: s.voiceSeconds,
    silenceSeconds: silences[i],
    outroSeconds: s.outroSeconds,
  }));
  const totalSeconds =
    introSeconds + conclusionSeconds + bells + composed.reduce((sum, s) => sum + s.voiceSeconds + s.silenceSeconds + s.outroSeconds, 0);
  return { def, options, steps: composed, introSeconds, conclusionSeconds, totalSeconds };
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
