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
  /**
   * Keyed by the original url on openmindfulness.net (Section.audioUrl).
   * `guide`: the guided part of a practice used by the sitting sessions, without
   * its bells and silent tail (scripts/audio-pack/guide.ts). `outro`: the spoken
   * conclusion of practices that have one (P42, P43), cut out of the guide.
   */
  tracks: Record<string, ManifestTrack & { guide?: ManifestTrack; outro?: ManifestTrack }>;
}

export interface ManifestTrack {
  file: string;
  bytes: number;
  /** Whole seconds for the original tracks, tenths for guides. */
  seconds: number;
}
