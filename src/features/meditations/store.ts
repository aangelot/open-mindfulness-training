/**
 * Meditation sessions in SQLite (meditation_sessions), synced with the account later.
 * Every write sets `dirty` and `updated_at`; deletions are soft.
 */
import { desc, eq, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { randomUUID } from 'expo-crypto';

import { db } from '@/core/db/client';
import { meditationSessions, type MeditationKind } from '@/core/db/schema';

export type MeditationSession = typeof meditationSessions.$inferSelect;

/** Sessions stopped before this are not recorded. */
export const MIN_RECORDED_SECONDS = 60;

export async function recordSession(session: {
  kind: MeditationKind;
  contentRef: string | null;
  startedAt: string;
  durationSeconds: number;
}) {
  await db.insert(meditationSessions).values({ id: randomUUID(), ...session });
}

export async function deleteSession(id: string) {
  const at = new Date().toISOString();
  await db.update(meditationSessions).set({ deletedAt: at, updatedAt: at, dirty: true }).where(eq(meditationSessions.id, id));
}

/** All sessions, most recent first. */
export function useSessions(): { sessions: MeditationSession[]; loaded: boolean } {
  const { data, updatedAt } = useLiveQuery(
    db.select().from(meditationSessions).where(isNull(meditationSessions.deletedAt)).orderBy(desc(meditationSessions.startedAt)),
  );
  return { sessions: data, loaded: updatedAt !== undefined };
}
