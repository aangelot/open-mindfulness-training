/** Book audios of the practices, as the sessions use them. */
import { clipSeconds } from '@/core/audio/manifest';
import { getSectionByRef } from '@/core/book/content';

import type { PracticeClips } from './sitting-sessions';

/** Guide (and outro) of a practice, or null when it has no audio (P29) or was not cut. */
export function practiceClips(ref: string): PracticeClips | null {
  const url = getSectionByRef(ref)?.audioUrl;
  if (!url) return null;
  const guideSeconds = clipSeconds(url, 'guide');
  if (guideSeconds === undefined) return null;
  return { url, guideSeconds, outroSeconds: clipSeconds(url, 'outro') };
}
