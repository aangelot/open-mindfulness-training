import { router } from 'expo-router';

import { localDate, parseLocalDate } from './cycle';

/** "2026-11-03" → "3 novembre 2026". */
export const formatDate = (date: string) =>
  parseLocalDate(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/** "2026-11-03" → "mar. 3 nov." */
export const formatShortDate = (date: string) =>
  parseLocalDate(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

/** ISO timestamp → local YYYY-MM-DD. */
export const isoToLocalDate = (iso: string) => localDate(new Date(iso));

/** 3 → "3", [10, 15] → "10–15". */
export const formatMinutes = (m: number | readonly [number, number]) => (typeof m === 'number' ? `${m}` : `${m[0]}–${m[1]}`);

// --- Navigation (routes live in src/app/(tabs)/carnet) -------------------------

export const openCycles = () => router.push('/carnet/cycles');
export const openCycle = (id: string) => router.push({ pathname: '/carnet/cycle/[id]', params: { id } });
/** `dayIndex` is 0-based; the URL shows the 1-based day ("jour/12"). */
export const openDay = (id: string, dayIndex: number) =>
  router.push({ pathname: '/carnet/cycle/[id]/jour/[day]', params: { id, day: String(dayIndex + 1) } });
export const openWeek = (id: string, week: number) =>
  router.push({ pathname: '/carnet/cycle/[id]/semaine/[week]', params: { id, week: String(week) } });
/** Book section of a practice or talk ("P10", "E8"), shown inside the carnet stack. */
export const openPractice = (ref: string) => router.push({ pathname: '/carnet/pratique/[ref]', params: { ref } });
