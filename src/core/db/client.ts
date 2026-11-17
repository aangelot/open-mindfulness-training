import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseAsync, openDatabaseSync } from 'expo-sqlite';
import { Platform } from 'react-native';

import * as schema from './schema';

export const DATABASE_NAME = 'omt.db';

function open() {
  const sqlite = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
  sqlite.execSync('PRAGMA foreign_keys = ON;');
  return drizzle(sqlite, { schema });
}
export type Database = ReturnType<typeof open>;

/**
 * Native: opened at import. Web: opened by `prepareDatabase()` (DatabaseProvider), because
 * expo-sqlite runs in a Web Worker there and a synchronous call made before the worker has
 * loaded gives up after a few milliseconds ("Sync operation timeout").
 */
export let db: Database = Platform.OS === 'web' ? (undefined as unknown as Database) : open();

export async function prepareDatabase() {
  if (db) return;
  // Any async call starts the worker and loads wa-sqlite; sync calls are fast afterwards.
  const warmup = await openDatabaseAsync(':memory:');
  await warmup.closeAsync();
  db = open();
}
