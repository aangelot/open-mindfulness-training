/**
 * Finds the guided part of a book practice, so sessions can chain practices
 * without their bells and long silent tails.
 *
 * Every practice audio of the book follows the same template:
 *   0–5 s    a bell (the same recording everywhere, fundamental ≈ 360 Hz)
 *   5–7 s    digital silence
 *   7 s–…    the guidance, with its own pauses
 *   …        quiet practice time (room tone around -48 dBFS)
 *   last ~6 s  the same bell again
 *
 * The "guide" is [OPENING_BELL_SECONDS, end of the last spoken passage + margin].
 * Pure functions over a mono PCM signal: tested without ffmpeg.
 */

export const OPENING_BELL_SECONDS = 5;
/** Analysis window. */
export const WINDOW_SECONDS = 0.25;
/** A window whose peak exceeds this is voice (room tone sits around -48 dBFS). */
const VOICE_DB = -30;
/** Pauses shorter than this belong to the guidance. */
const MERGE_GAP_SECONDS = 25;
/** Kept after the last word so it does not end abruptly (a fade-out is applied on top). */
const TAIL_MARGIN_SECONDS = 2;
const BELL_HZ = 360;
/** Share of a window's energy at BELL_HZ above which it is the bell ringing. */
const BELL_RATIO = 0.3;
/** The bell is tonal ~1.5 s after it is struck: its onset lies at most this far before. */
const BELL_ATTACK_SECONDS = 3.5;
const CLOSING_BELL_SEARCH_SECONDS = 15;

export interface WindowStats {
  peakDb: number;
  /** Energy share at the bell frequency, 0..1. */
  bell: number;
}

export function analyze(samples: Float32Array, sampleRate: number): WindowStats[] {
  const size = Math.round(WINDOW_SECONDS * sampleRate);
  const out: WindowStats[] = [];
  for (let start = 0; start + size <= samples.length; start += size) {
    let peak = 0;
    let energy = 0;
    let re = 0;
    let im = 0;
    for (let j = 0; j < size; j++) {
      const v = samples[start + j];
      peak = Math.max(peak, Math.abs(v));
      energy += v * v;
      const w = (2 * Math.PI * BELL_HZ * j) / sampleRate;
      re += v * Math.cos(w);
      im += v * Math.sin(w);
    }
    out.push({
      peakDb: 20 * Math.log10(peak + 1e-9),
      bell: energy > 0 ? (re * re + im * im) / ((size / 2) * energy) : 0,
    });
  }
  return out;
}

/** Seconds where the closing bell starts, or the end of the file when there is none. */
export function closingBellStart(windows: WindowStats[]): number {
  const w = (s: number) => Math.round(s / WINDOW_SECONDS);
  const from = Math.max(w(OPENING_BELL_SECONDS + 2), windows.length - w(CLOSING_BELL_SEARCH_SECONDS));
  let first = -1;
  for (let i = from; i < windows.length; i++) {
    if (windows[i].bell > BELL_RATIO && windows[i].peakDb > -40) {
      first = i;
      break;
    }
  }
  if (first < 0) return windows.length * WINDOW_SECONDS;
  // Walk back to the strike: the last quiet window before the bell, within its attack time.
  let onset = first;
  while (onset > first - w(BELL_ATTACK_SECONDS) && windows[onset - 1].peakDb > VOICE_DB - 5) onset--;
  return onset * WINDOW_SECONDS;
}

/** Spoken passages [start, end] in seconds, pauses under MERGE_GAP_SECONDS merged. */
export function voiceSpans(windows: WindowStats[], from: number, to: number): [number, number][] {
  const spans: [number, number][] = [];
  const loud = (i: number) => (windows[i]?.peakDb ?? -Infinity) > VOICE_DB;
  for (let i = Math.round(from / WINDOW_SECONDS); i < Math.round(to / WINDOW_SECONDS); i++) {
    // A lone loud window is a click or a breath, not speech (some recordings have a noisy floor).
    if (!loud(i) || !(loud(i - 1) || loud(i + 1))) continue;
    const t = i * WINDOW_SECONDS;
    const last = spans.at(-1);
    if (last && t - last[1] < MERGE_GAP_SECONDS) last[1] = t + WINDOW_SECONDS;
    else spans.push([t, t + WINDOW_SECONDS]);
  }
  return spans;
}

export interface GuideBounds {
  start: number;
  end: number;
  /** Where the closing bell starts (or the file ends). */
  bell: number;
  /** The closing passage, when asked for (see `withOutro`). */
  outro?: { start: number; end: number };
}

const tenth = (s: number) => Math.round(s * 10) / 10;

/**
 * `withOutro`: the practice ends with a spoken conclusion after a long pause
 * (P42, P43: the dedication). The guide then stops before that pause and the
 * conclusion becomes a separate clip, so a session can lengthen the pause.
 */
export function guideBounds(windows: WindowStats[], withOutro = false): GuideBounds | null {
  const bell = closingBellStart(windows);
  const spans = voiceSpans(windows, OPENING_BELL_SECONDS, bell);
  const last = spans.at(-1);
  if (!last) return null;
  const endAfter = (s: number) => tenth(Math.min(s + TAIL_MARGIN_SECONDS, bell - WINDOW_SECONDS));
  if (withOutro) {
    const before = spans.at(-2);
    if (!before) throw new Error('withOutro: a single spoken passage, nothing to split');
    return {
      start: OPENING_BELL_SECONDS,
      end: endAfter(before[1]),
      bell,
      outro: { start: tenth(Math.max(before[1], last[0] - 1)), end: endAfter(last[1]) },
    };
  }
  return { start: OPENING_BELL_SECONDS, end: endAfter(last[1]), bell };
}
