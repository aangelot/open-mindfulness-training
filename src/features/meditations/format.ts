import { router } from 'expo-router';

import { i18n } from '@/core/i18n';
import { PROGRAM } from '@/core/program';

import { getSittingSession, type SittingSessionDef } from './sitting-sessions';
import type { MeditationSession } from './store';

const t = i18n.t.bind(i18n);

/** 125 → "2:05", 3725 → "1:02:05". */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60));
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${mm.padStart(2, '0')}:${ss}` : `${mm}:${ss}`;
}

export { formatDuration } from '@/core/format';

const pad = (n: number) => String(n).padStart(2, '0');

/** Local YYYY-MM-DD. */
export const localDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "7h30", "07:30", "7.30" → [7, 30]. */
export function parseTime(text: string): [number, number] | null {
  const m = /^\s*(\d{1,2})\s*[:hH.]\s*(\d{2})?\s*$/.exec(text);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  return h < 24 && min < 60 ? [h, min] : null;
}

/** ISO timestamp → "07:30" (local). */
export const formatTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** "Aujourd'hui", "Hier", or "mardi 3 novembre". */
export function formatDay(day: Date, today = new Date()): string {
  const key = localDay(day);
  if (key === localDay(today)) return t('meditations.history.today');
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (key === localDay(yesterday)) return t('meditations.history.yesterday');
  return day.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: day.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

/** Sessions started since Monday 00:00 (local). */
export function thisWeek(sessions: readonly MeditationSession[], now = new Date()) {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const week = sessions.filter((s) => new Date(s.startedAt) >= monday);
  return { count: week.length, seconds: week.reduce((sum, s) => sum + s.durationSeconds, 0) };
}

/** "Étape 3 · La présence ouverte à ce qui nous entoure", week 5 names its training. */
export function sittingTitle(def: SittingSessionDef): string {
  const name = def.group ? t(`meditations.sitting.groups.${def.group}`) : PROGRAM[def.week - 1].title;
  return `${t('meditations.sitting.step', { n: def.week })} · ${name}`;
}

/** What a recorded session was, for the history. */
export function sessionLabel(session: MeditationSession): string {
  const kind = t(`meditations.history.kinds.${session.kind}`);
  if (session.kind === 'guided' && session.contentRef) return `${kind} · ${session.contentRef}`;
  if (session.kind === 'sitting_type' && session.contentRef) {
    const def = getSittingSession(session.contentRef.split(':')[0]);
    return def ? `${kind} · ${t('meditations.sitting.step', { n: def.week })}${def.group ? ` (${t(`meditations.sitting.groups.${def.group}`).toLowerCase()})` : ''}` : kind;
  }
  return kind;
}

// --- Navigation (routes live in src/app/(tabs)/meditations) ------------------

export const openPlayer = () => router.push('/meditations/seance');
export const openSitting = (id: string) => router.push({ pathname: '/meditations/pratique-type/[id]', params: { id } });
export const openCatalog = () => router.push('/meditations/livre');
export const openTimer = () => router.push('/meditations/minuteur');
export const openHistory = () => router.push('/meditations/historique');
export const openAddSession = () => router.push('/meditations/ajouter');
/** The book section, in the Livre tab. */
export const openBookSection = (id: string) => router.push({ pathname: '/livre/[id]', params: { id } });
