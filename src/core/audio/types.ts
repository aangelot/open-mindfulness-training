/**
 * Audio playback contract used by features (meditations, carnet, book).
 * Implemented with expo-audio (background playback + lock-screen controls).
 * Features depend on this interface, never on expo-audio directly.
 */

export type AudioSource =
  | { kind: 'remote'; url: string } // MP3 on openmindfulness.net (or cached copy)
  | { kind: 'asset'; module: number } // bundled sound, e.g. gong: require('@/assets/sounds/gong.mp3')
  | { kind: 'silence'; seconds: number }; // timer gaps between gongs

export interface Track {
  id: string;
  title: string;
  source: AudioSource;
}

export interface PlaybackState {
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'ended';
  trackIndex: number;
  positionSeconds: number;
  durationSeconds: number;
}

export interface AudioEngine {
  /** Replaces the queue and starts playing. A free timer is a queue: gong, silence, gong… */
  play(queue: Track[], options?: { lockScreenTitle?: string }): Promise<void>;
  pause(): void;
  resume(): void;
  seekTo(seconds: number): void;
  stop(): void;
  subscribe(listener: (state: PlaybackState) => void): () => void;
}
