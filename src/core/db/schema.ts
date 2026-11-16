/**
 * Local SQLite schema (source of truth on the device).
 * Mirrors supabase/migrations: same tables, plus sync bookkeeping.
 *
 * After any change: `npm run db:generate` and commit the new files in /drizzle.
 */
import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/** Columns every synced table carries. ids are client-generated UUIDs. */
const syncColumns = {
  id: text('id').primaryKey(),
  /** Null while the user has no account; filled on first sign-in. */
  userId: text('user_id'),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  deletedAt: text('deleted_at'),
  /** 1 = local change not yet pushed to Supabase. */
  dirty: integer('dirty', { mode: 'boolean' }).notNull().default(true),
};

export const trainingCycles = sqliteTable('training_cycles', {
  ...syncColumns,
  programVersion: text('program_version').notNull().default('carnet-2019'),
  startDate: text('start_date').notNull(), // YYYY-MM-DD
});

export const dailyReports = sqliteTable(
  'daily_reports',
  {
    ...syncColumns,
    cycleId: text('cycle_id').notNull().references(() => trainingCycles.id),
    dayIndex: integer('day_index').notNull(), // 0..55, week = floor(dayIndex / 7) + 1
    date: text('date').notNull(),
    practiceMinutes: integer('practice_minutes'),
    positives: text('positives'),
    obstacles: text('obstacles'),
    remedies: text('remedies'),
  },
  (t) => [uniqueIndex('daily_reports_cycle_day').on(t.cycleId, t.dayIndex)],
);

export const reminderRatings = sqliteTable(
  'reminder_ratings',
  {
    ...syncColumns,
    cycleId: text('cycle_id').notNull().references(() => trainingCycles.id),
    dayIndex: integer('day_index').notNull(),
    reminderId: text('reminder_id').notNull(),
    rating: text('rating', { enum: ['A', 'B', 'C', 'D', 'E'] }).notNull(),
  },
  (t) => [uniqueIndex('reminder_ratings_cycle_day_reminder').on(t.cycleId, t.dayIndex, t.reminderId)],
);

export const reminderNotes = sqliteTable(
  'reminder_notes',
  {
    ...syncColumns,
    cycleId: text('cycle_id').notNull().references(() => trainingCycles.id),
    week: integer('week').notNull(),
    reminderId: text('reminder_id').notNull(),
    note: text('note').notNull(),
  },
  (t) => [uniqueIndex('reminder_notes_cycle_week_reminder').on(t.cycleId, t.week, t.reminderId)],
);

export const meditationSessions = sqliteTable('meditation_sessions', {
  ...syncColumns,
  kind: text('kind', { enum: ['guided', 'free', 'sitting_type'] }).notNull(),
  contentRef: text('content_ref'),
  startedAt: text('started_at').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
});
