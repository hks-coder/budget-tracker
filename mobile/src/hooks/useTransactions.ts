import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Transaction, TransactionFilters } from '../core/types';
import {
  getAllTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  restoreTransaction,
  duplicateTransaction,
} from '../data/transactionRepository';
import { filterTransactions, groupTransactionsByDate } from '../core/calculations';
import type { TransactionInput } from '../core/types';

const DEFAULT_FILTERS: TransactionFilters = {
  period: 'month',
  type: 'all',
  searchText: '',
};

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [undoTransaction, setUndoTransaction] = useState<Transaction | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllTransactions();
      setTransactions(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filters),
    [transactions, filters],
  );

  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(filteredTransactions),
    [filteredTransactions],
  );

  const addTransaction = useCallback(async (input: TransactionInput): Promise<Transaction> => {
    const created = await createTransaction(input);
    setTransactions((prev) => [created, ...prev]);
    return created;
  }, []);

  const editTransaction = useCallback(
    async (id: string, input: Partial<TransactionInput>): Promise<void> => {
      const updated = await updateTransaction(id, input);
      if (updated) {
        setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
      }
    },
    [],
  );

  const removeTransaction = useCallback(async (id: string): Promise<void> => {
    const toDelete = transactions.find((t) => t.id === id);
    if (!toDelete) return;

    await deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // Set up undo
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoTransaction(toDelete);
    undoTimerRef.current = setTimeout(() => {
      setUndoTransaction(null);
    }, 5000);
  }, [transactions]);

  const undoDelete = useCallback(async (): Promise<void> => {
    if (!undoTransaction) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    await restoreTransaction(undoTransaction);
    setTransactions((prev) => [undoTransaction, ...prev].sort((a, b) =>
      b.date.localeCompare(a.date),
    ));
    setUndoTransaction(null);
  }, [undoTransaction]);

  const duplicateT = useCallback(async (id: string): Promise<void> => {
    const created = await duplicateTransaction(id);
    if (created) {
      setTransactions((prev) => [created, ...prev]);
    }
  }, []);

  const dismissUndo = useCallback(() => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoTransaction(null);
  }, []);

  return {
    transactions,
    filteredTransactions,
    groupedTransactions,
    loading,
    filters,
    setFilters,
    undoTransaction,
    addTransaction,
    editTransaction,
    removeTransaction,
    undoDelete,
    duplicateT,
    dismissUndo,
    reload: load,
  };
}
