/**
 * Links into another tab's stack, shared by the features (plain routes: no feature imports).
 */
import { router } from 'expo-router';

import { weekSittingSessions } from '@/core/program';

export const openBookSection = (id: string) => router.push({ pathname: '/livre/[id]', params: { id } });

export const openCarnet = () => router.navigate('/carnet');

/** `dayIndex` is 0-based; the URL shows the 1-based day. */
export const openCarnetDay = (cycleId: string, dayIndex: number) =>
  router.push({ pathname: '/carnet/cycle/[id]/jour/[day]', params: { id: cycleId, day: String(dayIndex + 1) } });

/** The week's guided "pratique type"; week 5 has two, chosen on the Méditations home. */
export function openWeekPractice(week: number) {
  const sessions = weekSittingSessions(week);
  if (sessions.length === 1) openSittingSession(sessions[0].id);
  else router.navigate('/meditations');
}

export const openSittingSession = (id: string) => router.push({ pathname: '/meditations/pratique-type/[id]', params: { id } });
