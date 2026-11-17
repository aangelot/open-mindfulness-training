/**
 * Read access to the training cycles (SQLite), shared by the Carnet (which writes them)
 * and the screens that follow the user's progress (home, Méditations).
 */
import { and, asc, eq, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '@/core/db/client';
import { dailyReports, trainingCycles } from '@/core/db/schema';

import { cycleNumbers } from './cycle';

export type Cycle = typeof trainingCycles.$inferSelect;
export type DailyReport = typeof dailyReports.$inferSelect;

// `loaded` is false until the first query returns: forms must wait for it before
// seeding their local state, or they would start empty and overwrite the saved text.

export function useCycles(): { cycles: Cycle[]; loaded: boolean } {
  const { data, updatedAt } = useLiveQuery(
    db.select().from(trainingCycles).where(isNull(trainingCycles.deletedAt)).orderBy(asc(trainingCycles.startDate)),
  );
  return { cycles: data, loaded: updatedAt !== undefined };
}

export function useCycleDays(cycleId: string): { days: DailyReport[]; loaded: boolean } {
  const { data, updatedAt } = useLiveQuery(
    db
      .select()
      .from(dailyReports)
      .where(and(eq(dailyReports.cycleId, cycleId), isNull(dailyReports.deletedAt)))
      .orderBy(asc(dailyReports.dayIndex)),
    [cycleId],
  );
  return { days: data, loaded: updatedAt !== undefined };
}

export interface ActiveCycle {
  cycle: Cycle;
  /** "Cycle 2" */
  number: number;
  days: DailyReport[];
}

/** The cycle in progress with its days; null when none runs. `loaded` covers both queries. */
export function useActiveCycle(): { active: ActiveCycle | null; cycles: Cycle[]; loaded: boolean } {
  const { cycles, loaded: cyclesLoaded } = useCycles();
  const cycle = cycles.find((c) => c.status === 'active');
  const { days, loaded: daysLoaded } = useCycleDays(cycle?.id ?? '');
  const active = cycle ? { cycle, number: cycleNumbers(cycles).get(cycle.id) ?? 1, days } : null;
  return { active, cycles, loaded: cyclesLoaded && (!cycle || daysLoaded) };
}
