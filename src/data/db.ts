import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'tabilao.db';

// Ouverture unique de la base, avec les PRAGMA de l'architecture (§4).
export const sqlite = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

sqlite.execSync(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA synchronous = NORMAL;
`);

export const db = drizzle(sqlite, { schema });

export type Database = typeof db;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
/** Base ou transaction : les repositories acceptent l'un ou l'autre. */
export type Executor = Database | Transaction;
