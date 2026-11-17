/**
 * Lengths (seconds) of the sounds bundled in assets/sounds. Shared with
 * scripts/audio-pack, which generates the files: keep this module free of imports.
 */

/** cloche.m4a: the book's bell, decay included. */
export const BELL_SECONDS = 5;

/** silence-<n>.m4a. Any whole number of seconds is a sum of these. */
export const SILENCE_SECONDS = [600, 120, 30, 5, 1] as const;
