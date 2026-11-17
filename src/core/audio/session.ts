/**
 * The meditation session engine: one session at a time, kept outside React so it
 * survives navigation. A session is a single native playlist (expo-audio,
 * ExoPlayer on Android): bells, guides and silences follow each other without
 * JavaScript, so the timing holds with the screen locked.
 */
import { createAudioPlaylist, setAudioModeAsync, type AudioPlaylist, type AudioPlaylistStatus } from 'expo-audio';
import { create } from 'zustand';

import { clipOf, resolveTrackUri, trackSeconds } from './offline';
import { BELL, BELL_SECONDS, silenceFiles } from './sounds';
import { buildTimeline, locate, partAt, type ItemResolver, type Timeline } from './timeline';
import type { SessionPlan, SessionResult } from './types';

/** `error`: a file could not be loaded (not downloaded and offline, or missing on the server). */
export type SessionStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export interface SessionState {
  plan: SessionPlan | null;
  status: SessionStatus;
  /** Seconds since the session start. */
  position: number;
  duration: number;
  partIndex: number;
  partStarts: number[];
}

const initial: SessionState = { plan: null, status: 'idle', position: 0, duration: 0, partIndex: 0, partStarts: [] };
export const useSession = create<SessionState>(() => initial);
const set = useSession.setState;

const resolveItem: ItemResolver = (item) => {
  switch (item.kind) {
    case 'track':
      return [{ source: resolveTrackUri(item.url), seconds: trackSeconds(item.url) ?? 0 }];
    case 'guide':
    case 'outro': {
      const clip = clipOf(item.url, item.kind);
      return clip ? [{ source: clip.uri, seconds: clip.seconds }] : [];
    }
    case 'bell':
      return [{ source: BELL, seconds: BELL_SECONDS }];
    case 'silence':
      return silenceFiles(item.seconds).map((f) => ({ source: f.module, seconds: f.seconds }));
  }
};

/** Duration of a plan, before playing it. */
export const planSeconds = (plan: SessionPlan) => buildTimeline(plan, resolveItem).total;

let playlist: AudioPlaylist | null = null;
let timeline: Timeline | null = null;
let unsubscribe: (() => void) | null = null;
let onEnd: ((result: SessionResult) => void) | undefined;
let startedAt = '';
let listened = 0;
let reported = true;

export async function startSession(plan: SessionPlan, options: { onEnd?: (result: SessionResult) => void } = {}) {
  stopSession();
  timeline = buildTimeline(plan, resolveItem);
  if (timeline.entries.length === 0) return;
  onEnd = options.onEnd;
  startedAt = new Date().toISOString();
  listened = 0;
  reported = false;
  set({ plan, status: 'loading', position: 0, duration: timeline.total, partIndex: 0, partStarts: timeline.partStarts });

  await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' });
  await load(plan, 0);
}

/** Creates the native playlist and plays from `position`. */
async function load(plan: SessionPlan, position: number) {
  if (!timeline) return;
  playlist = createAudioPlaylist({ sources: timeline.entries.map((e) => e.source), updateInterval: 500 });
  const sub = playlist.addListener('playlistStatusUpdate', onStatus);
  unsubscribe = () => sub.remove();
  playlist.setActiveForLockScreen(true, { title: plan.title, artist: 'Open Mindfulness' });
  if (position > 0) {
    const { index, offset } = locate(timeline, position);
    playlist.skipTo(index);
    await playlist.seekTo(offset);
  }
  playlist.play();
}

/** After an error: a fresh player, from where the session stopped. */
export async function retrySession() {
  const { plan, position, status } = useSession.getState();
  if (!plan || !timeline || status !== 'error') return;
  release();
  set({ status: 'loading' });
  await load(plan, position);
}

function onStatus(s: AudioPlaylistStatus & { error?: { message?: string } | null }) {
  if (!timeline || reported) return;
  if (s.error) {
    // The native player stops on a file it cannot load; without this the session would spin forever.
    console.warn('[session] cannot play entry', s.currentIndex, s.error.message);
    playlist?.pause();
    set({ status: 'error' });
    return;
  }
  if (useSession.getState().status === 'error') return;
  const entry = timeline.entries[s.currentIndex];
  if (!entry) return;
  const position = timeline.offsets[s.currentIndex] + Math.min(s.currentTime, entry.seconds);
  listened = Math.max(listened, position);
  const last = s.currentIndex >= timeline.entries.length - 1;
  if (last && (s.didJustFinish || (!s.playing && s.duration > 0 && s.currentTime >= s.duration - 0.3))) {
    finish(true);
    return;
  }
  set({
    position,
    partIndex: partAt(timeline, position),
    status: s.playing ? (s.isBuffering ? 'loading' : 'playing') : s.isLoaded ? 'paused' : 'loading',
  });
}

function report(completed: boolean) {
  if (reported) return;
  reported = true;
  const listenedSeconds = Math.round(completed ? (timeline?.total ?? listened) : listened);
  onEnd?.({ startedAt, listenedSeconds, completed });
}

function release() {
  unsubscribe?.();
  unsubscribe = null;
  if (playlist) {
    playlist.pause();
    playlist.destroy();
    playlist.release();
    playlist = null;
  }
}

function finish(completed: boolean) {
  report(completed);
  release();
  set((s) => ({ status: 'ended', position: completed ? s.duration : s.position }));
}

export function pauseSession() {
  playlist?.pause();
}

export function resumeSession() {
  playlist?.play();
}

export async function seekSession(position: number) {
  if (!playlist || !timeline) return;
  const target = Math.min(Math.max(0, position), timeline.total - 0.5);
  const { index, offset } = locate(timeline, target);
  if (index !== playlist.currentIndex) playlist.skipTo(index);
  await playlist.seekTo(offset);
  set({ position: target, partIndex: partAt(timeline, target) });
}

/** Stops and forgets the session. A session stopped midway is reported as not completed. */
export function stopSession() {
  report(false);
  release();
  timeline = null;
  set(initial);
}
