/** The audio pack manifest (scripts/audio-pack), without the download machinery. */
import manifestJson from '@/content/generated/audio.json';

import type { AudioManifest } from './manifest-types';

export const audioManifest = manifestJson as AudioManifest;

/** Seconds of a book audio, known before it loads. */
export const trackSeconds = (url: string) => audioManifest.tracks[url]?.seconds;

/** Length of the guided part (or spoken conclusion) of a practice, if it was cut. */
export const clipSeconds = (url: string, part: 'guide' | 'outro') => audioManifest.tracks[url]?.[part]?.seconds;
