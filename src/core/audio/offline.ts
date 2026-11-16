/**
 * Offline copies of the book audios.
 *
 * The files are mono AAC re-encodings hosted on a GitHub release
 * (scripts/audio-pack). Nothing is downloaded until the user agrees; then the
 * whole pack is fetched, one file at a time, and resumed on the next launch if
 * the app was closed in between.
 */
import { Directory, File, Paths } from 'expo-file-system';
import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';

import manifestJson from '@/content/generated/audio.json';

import type { AudioManifest } from './manifest-types';

export const audioManifest = manifestJson as AudioManifest;
const tracks = Object.values(audioManifest.tracks);

/** False until the audio pack has been built (empty manifest). */
export const offlineAudioAvailable = tracks.length > 0;

const ROOT = new Directory(Paths.document, 'audio');
const releaseDir = () => new Directory(ROOT, audioManifest.release);
const localFile = (file: string) => new File(releaseDir(), file);
const isComplete = (t: { file: string; bytes: number }) => {
  const f = localFile(t.file);
  return f.exists && f.size === t.bytes;
};

const CHOICE_KEY = 'offlineAudio.choice';
/** Margin kept free on the device besides the pack itself. */
const SPACE_MARGIN = 50e6;

export type OfflineChoice = 'accepted' | 'declined' | null;

interface OfflineAudioState {
  choice: OfflineChoice;
  downloading: boolean;
  error: 'network' | 'space' | null;
  doneCount: number;
  doneBytes: number;
}

export const useOfflineAudio = create<OfflineAudioState>(() => ({
  choice: null,
  downloading: false,
  error: null,
  doneCount: 0,
  doneBytes: 0,
}));

const set = useOfflineAudio.setState;
let cancelRequested = false;

function setChoice(choice: Exclude<OfflineChoice, null>) {
  Storage.setItemSync(CHOICE_KEY, choice);
  set({ choice });
}

function refresh() {
  const done = tracks.filter(isComplete);
  set({ doneCount: done.length, doneBytes: done.reduce((sum, t) => sum + t.bytes, 0) });
}

/** Call once at startup: restores the user's choice and resumes an interrupted download. */
export function initOfflineAudio() {
  const choice = Storage.getItemSync(CHOICE_KEY) as OfflineChoice;
  set({ choice });
  if (!offlineAudioAvailable) return;
  // Files of a previous release are useless once the manifest moved on.
  if (ROOT.exists) {
    for (const item of ROOT.list()) if (item.name !== audioManifest.release) item.delete();
  }
  refresh();
  if (choice === 'accepted' && useOfflineAudio.getState().doneCount < tracks.length) void downloadOfflineAudio();
}

export async function downloadOfflineAudio() {
  if (useOfflineAudio.getState().downloading || !offlineAudioAvailable) return;
  setChoice('accepted');
  cancelRequested = false;

  const missing = tracks.filter((t) => !isComplete(t));
  const needed = missing.reduce((sum, t) => sum + t.bytes, 0);
  if (Paths.availableDiskSpace < needed + SPACE_MARGIN) {
    set({ error: 'space' });
    return;
  }

  set({ downloading: true, error: null });
  releaseDir().create({ idempotent: true, intermediates: true });
  try {
    for (const track of missing) {
      if (cancelRequested) break;
      const file = await File.downloadFileAsync(audioManifest.baseUrl + track.file, localFile(track.file), { idempotent: true });
      if (file.size !== track.bytes) {
        file.delete();
        throw new Error(`${track.file}: size ${file.size}, expected ${track.bytes}`);
      }
      set((s) => ({ doneCount: s.doneCount + 1, doneBytes: s.doneBytes + track.bytes }));
    }
  } catch (e) {
    console.warn('[offline audio]', e);
    set({ error: 'network' });
  } finally {
    set({ downloading: false });
    refresh();
  }
}

/** Stops after the file being downloaded. */
export function pauseOfflineAudio() {
  cancelRequested = true;
}

/** "Plus tard": the offer stays available in the profile. */
export function declineOfflineAudio() {
  setChoice('declined');
}

export function deleteOfflineAudio() {
  cancelRequested = true;
  if (ROOT.exists) ROOT.delete();
  setChoice('declined');
  set({ error: null });
  refresh();
}

/** Seconds of a book audio, known before it loads. */
export const trackSeconds = (url: string) => audioManifest.tracks[url]?.seconds;

/**
 * What the player should load for a book audio: the offline copy if present,
 * else the light version streamed from the release, else the site's original.
 */
export function resolveTrackUri(url: string): string {
  const track = audioManifest.tracks[url];
  if (!track) return url;
  return isComplete(track) ? localFile(track.file).uri : audioManifest.baseUrl + track.file;
}
