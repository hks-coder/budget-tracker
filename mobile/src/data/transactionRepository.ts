import { getDatabase } from './database';
import type { Transaction, TransactionInput } from '../core/types';

function generateId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

/** Returns all transactions ordered by date descending */
export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Transaction>(
    'SELECT * FROM transactions ORDER BY date DESC, createdAt DESC',
  );
  return rows;
}

/** Returns transactions for a specific YYYY-MM month */
export async function getTransactionsByMonth(yearMonth: string): Promise<Transaction[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Transaction>(
    "SELECT * FROM transactions WHERE date LIKE ? ORDER BY date DESC",
    [`${yearMonth}%`],
  );
  return rows;
}

/** Returns a single transaction by id */
export async function getTransactionById(id: string): Promise<Transaction | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Transaction>(
    'SELECT * FROM transactions WHERE id = ?',
    [id],
  );
  return row ?? null;
}

/** Inserts a new transaction and returns it */
export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const db = await getDatabase();
  const id = generateId();
  const now = nowISO();

  await db.runAsync(
    `INSERT INTO transactions (id, type, amount, category, description, date, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.type, input.amount, input.category, input.description, input.date, now, now],
  );

  return {
    id,
    type: input.type,
    amount: input.amount,
    category: input.category,
    description: input.description,
    date: input.date,
    createdAt: now,
    updatedAt: now,
  };
}

/** Updates an existing transaction */
export async function updateTransaction(
  id: string,
  input: Partial<TransactionInput>,
): Promise<Transaction | null> {
  const existing = await getTransactionById(id);
  if (!existing) return null;

  const db = await getDatabase();
  const now = nowISO();
  const updated: Transaction = {
    ...existing,
    ...input,
    id,
    updatedAt: now,
  };

  await db.runAsync(
    `UPDATE transactions
     SET type = ?, amount = ?, category = ?, description = ?, date = ?, updatedAt = ?
     WHERE id = ?`,
    [updated.type, updated.amount, updated.category, updated.description, updated.date, now, id],
  );

  return updated;
}

/** Deletes a transaction by id */
export async function deleteTransaction(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
  return result.changes > 0;
}

/** Restores a previously deleted transaction (for undo) */
export async function restoreTransaction(transaction: Transaction): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO transactions (id, type, amount, category, description, date, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transaction.id,
      transaction.type,
      transaction.amount,
      transaction.category,
      transaction.description,
      transaction.date,
      transaction.createdAt,
      transaction.updatedAt,
    ],
  );
}

/** Duplicates a transaction (creates a new one with today's date) */
export async function duplicateTransaction(id: string): Promise<Transaction | null> {
  const existing = await getTransactionById(id);
  if (!existing) return null;

  const today = new Date().toISOString().split('T')[0];
  return createTransaction({
    type: existing.type,
    amount: existing.amount,
    category: existing.category,
    description: `${existing.description} (copie)`,
    date: today,
  });
}

// ─── App Settings ─────────────────────────────────────────────────────────────

/** Gets an app setting value by key */
export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

/** Sets (upserts) an app setting */
export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
    [key, value],
  );
}
