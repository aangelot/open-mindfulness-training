import { basename } from 'node:path';

/** "P5-ch3-étape-1.mp3" → "p5-ch3-etape-1" (release assets must be plain ASCII). */
export function assetName(url: string): string {
  const file = decodeURIComponent(basename(new URL(url).pathname)).replace(/\.mp3$/i, '');
  return file
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
