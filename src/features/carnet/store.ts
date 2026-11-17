/**
 * Carnet storage: cycles, daily reports, reminder ratings and weekly notes in SQLite.
 * Every write sets `dirty` and `updated_at` so the future sync pushes it; deletions are soft.
 */
import { and, eq, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { randomUUID } from 'expo-crypto';
import { useMemo } from 'react';

import { db } from '@/core/db/client';
import { dailyReports, reminderNotes, reminderRatings, trainingCycles, type CycleStatus } from '@/core/db/schema';
import { localDate } from '@/core/cycle';
import type { DailyReport } from '@/core/cycle-store';
import type { ReminderRating } from '@/core/program';

export type ReportPatch = Partial<
  Pick<DailyReport, 'practiceMinutes' | 'positives' | 'obstacles' | 'remedies' | 'obstacleIds' | 'remedyIds'>
>;

const now = () => new Date().toISOString();
const touched = () => ({ updatedAt: now(), dirty: true, deletedAt: null });

// --- Reads ------------------------------------------------------------------

export { useCycleDays, useCycles, type Cycle, type DailyReport } from '@/core/cycle-store';

/** Ratings of a cycle, keyed `${dayIndex}:${reminderId}`. */
export function useCycleRatings(cycleId: string): ReadonlyMap<string, ReminderRating> {
  const { data } = useLiveQuery(
    db
      .select({ dayIndex: reminderRatings.dayIndex, reminderId: reminderRatings.reminderId, rating: reminderRatings.rating })
      .from(reminderRatings)
      .where(and(eq(reminderRatings.cycleId, cycleId), isNull(reminderRatings.deletedAt))),
    [cycleId],
  );
  return useMemo(() => new Map(data.map((r) => [ratingKey(r.dayIndex, r.reminderId), r.rating])), [data]);
}

export const ratingKey = (dayIndex: number, reminderId: string) => `${dayIndex}:${reminderId}`;

/** "Observations particulières" of a week, keyed by reminder id. */
export function useWeekNotes(cycleId: string, week: number): { notes: ReadonlyMap<string, string>; loaded: boolean } {
  const { data, updatedAt } = useLiveQuery(
    db
      .select({ reminderId: reminderNotes.reminderId, note: reminderNotes.note })
      .from(reminderNotes)
      .where(and(eq(reminderNotes.cycleId, cycleId), eq(reminderNotes.week, week), isNull(reminderNotes.deletedAt))),
    [cycleId, week],
  );
  const notes = useMemo(() => new Map(data.map((n) => [n.reminderId, n.note])), [data]);
  return { notes, loaded: updatedAt !== undefined };
}

// --- Cycles -----------------------------------------------------------------

/** Starts a new cycle. A cycle still active is closed first with `closeCurrentAs`. */
export function startCycle(closeCurrentAs: Exclude<CycleStatus, 'active'> = 'abandoned'): string {
  const id = randomUUID();
  db.transaction((tx) => {
    tx.update(trainingCycles)
      .set({ status: closeCurrentAs, endedAt: now(), ...touched() })
      .where(and(eq(trainingCycles.status, 'active'), isNull(trainingCycles.deletedAt)))
      .run();
    tx.insert(trainingCycles).values({ id, startDate: localDate(), createdAt: now() }).run();
  });
  return id;
}

export async function endCycle(id: string, status: Exclude<CycleStatus, 'active'>) {
  await db.update(trainingCycles).set({ status, endedAt: now(), ...touched() }).where(eq(trainingCycles.id, id));
}

/** Makes a closed cycle active again; the cycle currently active, if any, is abandoned. */
export function resumeCycle(id: string) {
  db.transaction((tx) => {
    tx.update(trainingCycles)
      .set({ status: 'abandoned', endedAt: now(), ...touched() })
      .where(and(eq(trainingCycles.status, 'active'), isNull(trainingCycles.deletedAt)))
      .run();
    tx.update(trainingCycles).set({ status: 'active', endedAt: null, ...touched() }).where(eq(trainingCycles.id, id)).run();
  });
}

/** Soft-deletes a cycle and everything recorded in it. */
export function deleteCycle(id: string) {
  const gone = { deletedAt: now(), updatedAt: now(), dirty: true };
  db.transaction((tx) => {
    tx.update(dailyReports).set(gone).where(eq(dailyReports.cycleId, id)).run();
    tx.update(reminderRatings).set(gone).where(eq(reminderRatings.cycleId, id)).run();
    tx.update(reminderNotes).set(gone).where(eq(reminderNotes.cycleId, id)).run();
    tx.update(trainingCycles).set(gone).where(eq(trainingCycles.id, id)).run();
  });
}

// --- Days -------------------------------------------------------------------

/** Creates or updates the report of a day. The first write dates the day (today). */
export async function saveDay(cycleId: string, dayIndex: number, patch: ReportPatch = {}) {
  await db
    .insert(dailyReports)
    .values({ id: randomUUID(), cycleId, dayIndex, date: localDate(), ...patch })
    .onConflictDoUpdate({
      target: [dailyReports.cycleId, dailyReports.dayIndex],
      set: { ...patch, ...touched() },
    });
}

/** Sets (or clears, with null) the A–E rating of a reminder on a day. */
export async function setRating(cycleId: string, dayIndex: number, reminderId: string, rating: ReminderRating | null) {
  await db.insert(dailyReports).values({ id: randomUUID(), cycleId, dayIndex, date: localDate() }).onConflictDoNothing();
  const target = [reminderRatings.cycleId, reminderRatings.dayIndex, reminderRatings.reminderId];
  if (rating === null) {
    await db
      .update(reminderRatings)
      .set({ deletedAt: now(), updatedAt: now(), dirty: true })
      .where(
        and(eq(reminderRatings.cycleId, cycleId), eq(reminderRatings.dayIndex, dayIndex), eq(reminderRatings.reminderId, reminderId)),
      );
    return;
  }
  await db
    .insert(reminderRatings)
    .values({ id: randomUUID(), cycleId, dayIndex, reminderId, rating })
    .onConflictDoUpdate({ target, set: { rating, ...touched() } });
}

/** Saves the week note of a reminder; an empty note deletes it. */
export async function setWeekNote(cycleId: string, week: number, reminderId: string, note: string) {
  const text = note.trim();
  if (!text) {
    await db
      .update(reminderNotes)
      .set({ deletedAt: now(), updatedAt: now(), dirty: true })
      .where(and(eq(reminderNotes.cycleId, cycleId), eq(reminderNotes.week, week), eq(reminderNotes.reminderId, reminderId)));
    return;
  }
  await db
    .insert(reminderNotes)
    .values({ id: randomUUID(), cycleId, week, reminderId, note: text })
    .onConflictDoUpdate({
      target: [reminderNotes.cycleId, reminderNotes.week, reminderNotes.reminderId],
      set: { note: text, ...touched() },
    });
}
