/**
 * Offline copies of the book audios.
 *
 * The files are mono AAC re-encodings hosted on a GitHub release
 * (scripts/audio-pack). Nothing is downloaded until the user agrees; then the
 * whole pack is fetched, one file at a time, and resumed on the next launch if
 * the app was closed in between.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';

import { audioManifest } from './manifest';
import type { ClipKind, ManifestTrack } from './manifest-types';

export { audioManifest, trackSeconds } from './manifest';
/** Every file of the pack: the book audios, plus the guides, outros and titles of the sitting sessions. */
const tracks: ManifestTrack[] = Object.values(audioManifest.tracks).flatMap((t) =>
  [t, t.guide, t.outro, t.title].filter((f) => f !== undefined),
);
export const offlineFileCount = tracks.length;

/** expo-file-system has no web implementation: on web, audios are always streamed. */
const fileSystemSupported = Platform.OS !== 'web';

/** False until the audio pack has been built (empty manifest), and on web. */
export const offlineAudioAvailable = fileSystemSupported && tracks.length > 0;

// Built lazily: constructing a Directory throws where the file system is unsupported.
const root = () => new Directory(Paths.document, 'audio');
const releaseDir = () => new Directory(root(), audioManifest.release);
const localFile = (file: string) => new File(releaseDir(), file);
const isComplete = (t: ManifestTrack) => {
  if (!fileSystemSupported) return false;
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
  // Web: nothing to restore (no offline copies), and the kv-store would make a sync SQLite call at startup.
  if (!fileSystemSupported) return;
  const choice = Storage.getItemSync(CHOICE_KEY) as OfflineChoice;
  set({ choice });
  if (!offlineAudioAvailable) return;
  // Files of a previous release are useless once the manifest moved on.
  const dir = root();
  if (dir.exists) {
    for (const item of dir.list()) if (item.name !== audioManifest.release) item.delete();
  }
  // So are files the manifest no longer lists (e.g. a voice replaced by another).
  const release = releaseDir();
  if (release.exists) {
    const known = new Set(tracks.map((t) => t.file));
    for (const item of release.list()) if (!known.has(item.name)) item.delete();
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
  if (fileSystemSupported && root().exists) root().delete();
  setChoice('declined');
  set({ error: null });
  refresh();
}

/**
 * What the player should load for a book audio: the offline copy if present,
 * else the light version streamed from the release, else the site's original.
 */
export function resolveTrackUri(url: string): string {
  const track = audioManifest.tracks[url];
  if (!track) return url;
  return fileUri(track);
}

const fileUri = (f: ManifestTrack) => (isComplete(f) ? localFile(f.file).uri : audioManifest.baseUrl + f.file);

/** Guided part, spoken conclusion or title of a practice, see scripts/audio-pack/guide.ts. */
export function clipOf(url: string, part: ClipKind): { uri: string; seconds: number } | null {
  const clip = audioManifest.tracks[url]?.[part];
  return clip ? { uri: fileUri(clip), seconds: clip.seconds } : null;
}
