/**
 * Reading progress, stored in SQLite (book_progress) so it syncs with the account later.
 */
import { desc, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { randomUUID } from 'expo-crypto';
import { useMemo } from 'react';

import { db } from '@/core/db/client';
import { bookProgress } from '@/core/db/schema';

const now = () => new Date().toISOString();

/** Records that the section was opened: it becomes the "Reprendre la lecture" target. */
export async function markOpened(sectionId: string) {
  const at = now();
  await db
    .insert(bookProgress)
    .values({ id: randomUUID(), sectionId, openedAt: at })
    .onConflictDoUpdate({
      target: bookProgress.sectionId,
      set: { openedAt: at, updatedAt: at, deletedAt: null, dirty: true },
    });
}

/** Marks the section read. Keeps the first read date. */
export async function markRead(sectionId: string) {
  const at = now();
  await db
    .insert(bookProgress)
    .values({ id: randomUUID(), sectionId, openedAt: at, readAt: at })
    .onConflictDoUpdate({
      target: bookProgress.sectionId,
      set: { readAt: at, updatedAt: at, deletedAt: null, dirty: true },
      // Already read: leave the row (and its sync state) untouched.
      setWhere: isNull(bookProgress.readAt),
    });
}

export interface BookProgress {
  readIds: ReadonlySet<string>;
  /** Most recently opened section. */
  lastOpenedId: string | null;
}

export function useBookProgress(): BookProgress {
  const { data } = useLiveQuery(
    db
      .select({ sectionId: bookProgress.sectionId, readAt: bookProgress.readAt })
      .from(bookProgress)
      .where(isNull(bookProgress.deletedAt))
      .orderBy(desc(bookProgress.openedAt)),
  );
  return useMemo(
    () => ({
      readIds: new Set(data.filter((r) => r.readAt).map((r) => r.sectionId)),
      lastOpenedId: data[0]?.sectionId ?? null,
    }),
    [data],
  );
}
