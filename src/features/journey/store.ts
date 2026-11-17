import { and, gte, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '@/core/db/client';
import { meditationSessions } from '@/core/db/schema';

/** Local midnight as an ISO string, comparable with `started_at`. */
const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
};

/** Seconds of meditation recorded today (in the app or added by hand). */
export function useTodayPracticeSeconds(): number {
  const since = startOfToday();
  const { data } = useLiveQuery(
    db
      .select({ seconds: meditationSessions.durationSeconds })
      .from(meditationSessions)
      .where(and(isNull(meditationSessions.deletedAt), gte(meditationSessions.startedAt, since))),
    [since],
  );
  return data.reduce((sum, r) => sum + r.seconds, 0);
}
