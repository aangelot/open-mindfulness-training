/** The audio pack manifest (scripts/audio-pack), without the download machinery. */
import manifestJson from '@/content/generated/audio.json';

import type { AudioManifest, ClipKind } from './manifest-types';

export const audioManifest = manifestJson as AudioManifest;

/** Seconds of a book audio, known before it loads. */
export const trackSeconds = (url: string) => audioManifest.tracks[url]?.seconds;

/** Length of the guided part, spoken conclusion or title of a practice, if it was cut. */
export const clipSeconds = (url: string, part: ClipKind) => audioManifest.tracks[url]?.[part]?.seconds;
