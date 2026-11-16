/**
 * Shape of src/content/generated/audio.json, produced by scripts/audio-pack.
 * Kept free of runtime imports so the Node script can share it.
 */
export interface AudioManifest {
  /** GitHub release tag holding the files. Changes when the files change. */
  release: string;
  /** Prefix of every file url, ends with "/". */
  baseUrl: string;
  totalBytes: number;
  /** Keyed by the original url on openmindfulness.net (Section.audioUrl). */
  tracks: Record<string, { file: string; bytes: number; seconds: number }>;
}
