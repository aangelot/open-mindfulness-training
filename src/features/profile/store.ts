/**
 * Reads for the statistics, straight from SQLite (features do not import each other),
 * and the erasure of all personal data.
 */
import { and, eq, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '@/core/db/client';
import {
  bookProgress,
  dailyReports,
  meditationSessions,
  reminderNotes,
  reminderRatings,
  trainingCycles,
} from '@/core/db/schema';

export function useSessionRefs() {
  const { data, updatedAt } = useLiveQuery(
    db
      .select({ startedAt: meditationSessions.startedAt, durationSeconds: meditationSessions.durationSeconds })
      .from(meditationSessions)
      .where(isNull(meditationSessions.deletedAt)),
  );
  return { sessions: data, loaded: updatedAt !== undefined };
}

/** Every filled day of every cycle still kept. */
export function useAllDays() {
  const { data } = useLiveQuery(
    db
      .select({
        cycleId: dailyReports.cycleId,
        practiceMinutes: dailyReports.practiceMinutes,
        obstacleIds: dailyReports.obstacleIds,
        remedyIds: dailyReports.remedyIds,
      })
      .from(dailyReports)
      .innerJoin(trainingCycles, eq(trainingCycles.id, dailyReports.cycleId))
      .where(and(isNull(dailyReports.deletedAt), isNull(trainingCycles.deletedAt))),
  );
  return data;
}

export function useCycleRatingList(cycleId: string) {
  const { data } = useLiveQuery(
    db
      .select({ dayIndex: reminderRatings.dayIndex, rating: reminderRatings.rating })
      .from(reminderRatings)
      .where(and(eq(reminderRatings.cycleId, cycleId), isNull(reminderRatings.deletedAt))),
    [cycleId],
  );
  return data;
}

/** Ids of the sections read. */
export function useReadSectionIds(): ReadonlySet<string> {
  const { data } = useLiveQuery(
    db
      .select({ sectionId: bookProgress.sectionId, readAt: bookProgress.readAt })
      .from(bookProgress)
      .where(isNull(bookProgress.deletedAt)),
  );
  return new Set(data.filter((r) => r.readAt).map((r) => r.sectionId));
}

/**
 * Deletes every personal record on the device: meditation sessions, carnet, reading progress.
 * Rows are really deleted, not soft-deleted: without an account nothing has to be synced.
 * The downloaded audio files are kept (they are content, not personal data).
 */
export function eraseAllData() {
  db.transaction((tx) => {
    tx.delete(reminderRatings).run();
    tx.delete(reminderNotes).run();
    tx.delete(dailyReports).run();
    tx.delete(trainingCycles).run();
    tx.delete(meditationSessions).run();
    tx.delete(bookProgress).run();
  });
}
