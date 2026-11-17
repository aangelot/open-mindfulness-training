/**
 * What a meditation session plays. Features describe a session as a plan of
 * parts; the session engine (./session.ts) turns it into one native playlist,
 * so the timing stays exact with the screen locked (Android suspends JS timers
 * in the background, but not the player).
 */

export type SessionItem =
  /** A book audio, whole (Section.audioUrl). */
  | { kind: 'track'; url: string }
  /** The guided part of a practice, without its bells and silent tail. */
  | { kind: 'guide'; url: string }
  /** The spoken conclusion of a practice that has one (P42, P43). */
  | { kind: 'outro'; url: string }
  /** The book's bell (5 s). */
  | { kind: 'bell' }
  | { kind: 'silence'; seconds: number };

/** A labelled stretch of the session, shown on the player screen. */
export interface SessionPart {
  label: string;
  /** Book reference of the practice ("P19"), if any. */
  ref?: string;
  /** No voice in this part (practice without audio, timer). */
  silent?: boolean;
  items: SessionItem[];
}

export interface SessionPlan {
  /** Shown on the player and the lock screen. */
  title: string;
  subtitle?: string;
  parts: SessionPart[];
}

/** Reported once, when the session ends or is stopped. */
export interface SessionResult {
  startedAt: string;
  /** Furthest point reached, in seconds. */
  listenedSeconds: number;
  completed: boolean;
}
