/** The free timer: a bell at the start and at the end, optionally at regular intervals. */
import { BELL_SECONDS } from '@/core/audio/sound-lengths';
import type { SessionItem, SessionPlan } from '@/core/audio/types';

export const TIMER_MINUTES = [5, 10, 15, 20, 30, 45, 60] as const;
export const TIMER_INTERVALS = [0, 5, 10, 15] as const;
export const MAX_TIMER_MINUTES = 240;

export interface TimerSettings {
  minutes: number;
  /** Minutes between intermediate bells, 0 for none. */
  interval: number;
}

/** Bell times in seconds: start, every interval, end. */
export function bellTimes({ minutes, interval }: TimerSettings): number[] {
  const end = minutes * 60;
  const times = [0];
  if (interval > 0) for (let t = interval * 60; t < end; t += interval * 60) times.push(t);
  times.push(end);
  return times;
}

/** Bells and silences, so each bell rings exactly on time. The last bell rings at the end. */
export function timerPlan(settings: TimerSettings, labels: { title: string; subtitle: string; part: string }): SessionPlan {
  const times = bellTimes(settings);
  const items: SessionItem[] = [];
  times.forEach((time, i) => {
    items.push({ kind: 'bell' });
    const next = times[i + 1];
    if (next !== undefined) items.push({ kind: 'silence', seconds: next - time - BELL_SECONDS });
  });
  return { title: labels.title, subtitle: labels.subtitle, parts: [{ label: labels.part, silent: true, items }] };
}
