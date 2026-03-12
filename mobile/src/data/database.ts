import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

/** Opens (or returns cached) the SQLite database */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('budget_tracker.db');
  await initializeSchema(_db);
  return _db;
}

/** Creates tables if they don't exist */
async function initializeSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense','savings')),
      amount REAL NOT NULL CHECK(amount > 0),
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

    CREATE TABLE IF NOT EXISTS category_budgets (
      id TEXT PRIMARY KEY NOT NULL,
      category TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL CHECK(amount >= 0),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}

/** Resets the cached db reference (used in tests) */
export function resetDatabase(): void {
  _db = null;
}
