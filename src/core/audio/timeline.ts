/**
 * Flattens a session plan into playlist entries with known durations, so the
 * engine can show one progress bar for the whole session and seek across files.
 */
import type { AudioSource } from 'expo-audio';

import type { SessionItem, SessionPlan } from './types';

export interface TimelineEntry {
  source: AudioSource;
  seconds: number;
  partIndex: number;
}

export interface Timeline {
  entries: TimelineEntry[];
  /** Start of each entry, seconds from the session start. */
  offsets: number[];
  /** Start of each part. */
  partStarts: number[];
  total: number;
}

/** Turns one item into files. An item that cannot be played (unknown clip) yields none. */
export type ItemResolver = (item: SessionItem) => { source: AudioSource; seconds: number }[];

export function buildTimeline(plan: SessionPlan, resolve: ItemResolver): Timeline {
  const entries: TimelineEntry[] = [];
  const offsets: number[] = [];
  const partStarts: number[] = [];
  let at = 0;
  plan.parts.forEach((part, partIndex) => {
    partStarts.push(at);
    for (const item of part.items) {
      for (const file of resolve(item)) {
        entries.push({ ...file, partIndex });
        offsets.push(at);
        at += file.seconds;
      }
    }
  });
  return { entries, offsets, partStarts, total: at };
}

/** Entry playing at `position`, and the position inside it. */
export function locate(timeline: Timeline, position: number): { index: number; offset: number } {
  const { offsets, entries } = timeline;
  let index = 0;
  while (index < entries.length - 1 && offsets[index + 1] <= position) index++;
  return { index, offset: Math.max(0, position - offsets[index]) };
}

/** Part playing at `position`. */
export function partAt(timeline: Timeline, position: number): number {
  let part = 0;
  timeline.partStarts.forEach((start, i) => {
    if (start <= position) part = i;
  });
  return part;
}
