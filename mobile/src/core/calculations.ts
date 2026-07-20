import type {
  Transaction,
  MonthlyTotals,
  MonthlyVariation,
  CategoryAggregate,
  DashboardData,
  FilterPeriod,
  TransactionFilters,
  TransactionType,
} from './types';

// ─── Date helpers ────────────────────────────────────────────────────────────

/** Returns 'YYYY-MM' string for a given Date */
export function getYearMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Returns a Date object for the first day of the given YYYY-MM string */
export function firstDayOfMonth(yearMonth: string): Date {
  return new Date(`${yearMonth}-01T00:00:00`);
}

/** Returns the YYYY-MM for the previous month */
export function previousYearMonth(yearMonth: string): string {
  const d = firstDayOfMonth(yearMonth);
  d.setMonth(d.getMonth() - 1);
  return getYearMonth(d);
}

/** Returns ISO date string (YYYY-MM-DD) from a Date */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Returns a Date for n days ago */
export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ─── Filtering ───────────────────────────────────────────────────────────────

/**
 * Returns the cutoff date string (YYYY-MM-DD) for a given filter period.
 * Transactions at or after this date are included.
 */
export function getFilterCutoffDate(period: FilterPeriod): string | null {
  const now = new Date();
  switch (period) {
    case '7d':
      return toISODate(daysAgo(7));
    case '30d':
      return toISODate(daysAgo(30));
    case 'month': {
      const ym = getYearMonth(now);
      return `${ym}-01`;
    }
    case 'year':
      return `${now.getFullYear()}-01-01`;
    case 'all':
      return null;
  }
}

/** Filters transactions according to the provided filter criteria */
export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  const cutoff = getFilterCutoffDate(filters.period);
  const text = filters.searchText.trim().toLowerCase();

  return transactions.filter((t) => {
    if (cutoff && t.date < cutoff) return false;
    if (filters.type !== 'all' && t.type !== filters.type) return false;
    if (text) {
      const haystack = `${t.description} ${t.category}`.toLowerCase();
      if (!haystack.includes(text)) return false;
    }
    return true;
  });
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

/** Computes income, expense, savings totals and balance for a list of transactions */
export function computeTotals(transactions: Transaction[]): MonthlyTotals {
  let income = 0;
  let expense = 0;
  let savings = 0;

  for (const t of transactions) {
    if (t.type === 'income') income += t.amount;
    else if (t.type === 'expense') expense += t.amount;
    else if (t.type === 'savings') savings += t.amount;
    else if (t.type === 'credit') income += t.amount;
  }

  return {
    income,
    expense,
    savings,
    balance: income - expense - savings,
  };
}

/** Filters transactions to a given YYYY-MM month */
export function transactionsForMonth(
  transactions: Transaction[],
  yearMonth: string,
): Transaction[] {
  return transactions.filter((t) => t.date.startsWith(yearMonth));
}

/** Computes monthly totals for a given YYYY-MM */
export function computeMonthlyTotals(
  transactions: Transaction[],
  yearMonth: string,
): MonthlyTotals {
  return computeTotals(transactionsForMonth(transactions, yearMonth));
}

/** Computes the variation between current and previous month */
export function computeMonthlyVariation(
  current: MonthlyTotals,
  previous: MonthlyTotals,
): MonthlyVariation {
  const pct = (cur: number, prev: number): number | null => {
    if (prev === 0) return null;
    return ((cur - prev) / Math.abs(prev)) * 100;
  };

  return {
    incomeChange: current.income - previous.income,
    expenseChange: current.expense - previous.expense,
    balanceChange: current.balance - previous.balance,
    incomeChangePercent: pct(current.income, previous.income),
    expenseChangePercent: pct(current.expense, previous.expense),
    balanceChangePercent: pct(current.balance, previous.balance),
  };
}

/** Computes aggregates per category for a given transaction type */
export function computeCategoryAggregates(
  transactions: Transaction[],
  type: TransactionType,
): CategoryAggregate[] {
  const filtered = transactions.filter((t) => t.type === type);
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  const map = new Map<string, { total: number; count: number }>();
  for (const t of filtered) {
    const existing = map.get(t.category) ?? { total: 0, count: 0 };
    map.set(t.category, {
      total: existing.total + t.amount,
      count: existing.count + 1,
    });
  }

  const result: CategoryAggregate[] = [];
  map.forEach((value, category) => {
    result.push({
      category,
      total: value.total,
      count: value.count,
      percentage: total > 0 ? (value.total / total) * 100 : 0,
    });
  });

  return result.sort((a, b) => b.total - a.total);
}

/** Builds DashboardData for the current month */
export function buildDashboardData(
  transactions: Transaction[],
  now: Date = new Date(),
): DashboardData {
  const currentYM = getYearMonth(now);
  const previousYM = previousYearMonth(currentYM);

  const currentMonth = computeMonthlyTotals(transactions, currentYM);
  const previousMonth = computeMonthlyTotals(transactions, previousYM);
  const variation = computeMonthlyVariation(currentMonth, previousMonth);
  const topExpenseCategories = computeCategoryAggregates(
    transactionsForMonth(transactions, currentYM),
    'expense',
  ).slice(0, 5);

  return { currentMonth, previousMonth, variation, topExpenseCategories };
}

/** Groups transactions by date (YYYY-MM-DD), sorted newest first */
export function groupTransactionsByDate(
  transactions: Transaction[],
): { date: string; transactions: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();

  for (const t of transactions) {
    const existing = map.get(t.date) ?? [];
    map.set(t.date, [...existing, t]);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, txns]) => ({ date, transactions: txns }));
}
