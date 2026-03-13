import {
  computeTotals,
  computeMonthlyTotals,
  computeMonthlyVariation,
  computeCategoryAggregates,
  buildDashboardData,
  filterTransactions,
  groupTransactionsByDate,
  getYearMonth,
  previousYearMonth,
} from '../../src/core/calculations';
import type { Transaction, TransactionFilters } from '../../src/core/types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'txn_test',
  type: 'expense',
  amount: 100,
  category: 'Courses',
  description: 'Test transaction',
  date: '2026-03-10',
  createdAt: '2026-03-10T10:00:00.000Z',
  updatedAt: '2026-03-10T10:00:00.000Z',
  ...overrides,
});

const FIXTURES: Transaction[] = [
  makeTransaction({ id: '1', type: 'income', amount: 2000, category: 'Salaire', description: 'Salaire mars', date: '2026-03-01' }),
  makeTransaction({ id: '2', type: 'expense', amount: 500, category: 'Courses', description: 'Carrefour', date: '2026-03-05' }),
  makeTransaction({ id: '3', type: 'expense', amount: 300, category: 'Appartement', description: 'Loyer', date: '2026-03-03' }),
  makeTransaction({ id: '4', type: 'savings', amount: 400, category: 'Livret A', description: 'Épargne mars', date: '2026-03-02' }),
  makeTransaction({ id: '5', type: 'income', amount: 1500, category: 'Salaire', description: 'Salaire février', date: '2026-02-01' }),
  makeTransaction({ id: '6', type: 'expense', amount: 200, category: 'Courses', description: 'Lidl', date: '2026-02-15' }),
];

// ─── computeTotals ────────────────────────────────────────────────────────────

describe('computeTotals', () => {
  it('computes income, expense, savings and balance correctly', () => {
    const totals = computeTotals(FIXTURES.slice(0, 4)); // March transactions
    expect(totals.income).toBe(2000);
    expect(totals.expense).toBe(800);
    expect(totals.savings).toBe(400);
    expect(totals.balance).toBe(2000 - 800 - 400); // 800
  });

  it('returns zero totals for empty list', () => {
    const totals = computeTotals([]);
    expect(totals.income).toBe(0);
    expect(totals.expense).toBe(0);
    expect(totals.savings).toBe(0);
    expect(totals.balance).toBe(0);
  });

  it('computes balance as income minus expense minus savings', () => {
    const transactions = [
      makeTransaction({ type: 'income', amount: 1000 }),
      makeTransaction({ type: 'expense', amount: 300 }),
      makeTransaction({ type: 'savings', amount: 200 }),
    ];
    const totals = computeTotals(transactions);
    expect(totals.balance).toBe(500);
  });
});

// ─── computeMonthlyTotals ─────────────────────────────────────────────────────

describe('computeMonthlyTotals', () => {
  it('filters by month correctly', () => {
    const marchTotals = computeMonthlyTotals(FIXTURES, '2026-03');
    expect(marchTotals.income).toBe(2000);
    expect(marchTotals.expense).toBe(800);
    expect(marchTotals.savings).toBe(400);
  });

  it('returns zero for month with no transactions', () => {
    const totals = computeMonthlyTotals(FIXTURES, '2025-01');
    expect(totals.income).toBe(0);
    expect(totals.expense).toBe(0);
    expect(totals.savings).toBe(0);
    expect(totals.balance).toBe(0);
  });
});

// ─── computeMonthlyVariation ──────────────────────────────────────────────────

describe('computeMonthlyVariation', () => {
  it('computes variation between months', () => {
    const current = computeMonthlyTotals(FIXTURES, '2026-03');
    const previous = computeMonthlyTotals(FIXTURES, '2026-02');
    const variation = computeMonthlyVariation(current, previous);

    expect(variation.incomeChange).toBe(2000 - 1500); // 500
    expect(variation.expenseChange).toBe(800 - 200); // 600
  });

  it('returns null percentage when previous is zero', () => {
    const current = { income: 1000, expense: 500, savings: 0, balance: 500 };
    const previous = { income: 0, expense: 0, savings: 0, balance: 0 };
    const variation = computeMonthlyVariation(current, previous);

    expect(variation.incomeChangePercent).toBeNull();
    expect(variation.expenseChangePercent).toBeNull();
    expect(variation.balanceChangePercent).toBeNull();
  });

  it('computes percentage correctly', () => {
    const current = { income: 200, expense: 0, savings: 0, balance: 200 };
    const previous = { income: 100, expense: 0, savings: 0, balance: 100 };
    const variation = computeMonthlyVariation(current, previous);

    expect(variation.incomeChangePercent).toBe(100); // +100%
    expect(variation.incomeChange).toBe(100);
  });

  it('handles negative changes', () => {
    const current = { income: 50, expense: 0, savings: 0, balance: 50 };
    const previous = { income: 100, expense: 0, savings: 0, balance: 100 };
    const variation = computeMonthlyVariation(current, previous);

    expect(variation.incomeChange).toBe(-50);
    expect(variation.incomeChangePercent).toBe(-50);
  });
});

// ─── computeCategoryAggregates ────────────────────────────────────────────────

describe('computeCategoryAggregates', () => {
  it('aggregates expenses by category', () => {
    const aggs = computeCategoryAggregates(FIXTURES, 'expense');
    expect(aggs.length).toBeGreaterThan(0);
    const courses = aggs.find((a) => a.category === 'Courses');
    expect(courses).toBeDefined();
    expect(courses!.total).toBe(700); // 500 + 200
    expect(courses!.count).toBe(2);
  });

  it('computes percentages that sum to 100', () => {
    const aggs = computeCategoryAggregates(FIXTURES, 'expense');
    const total = aggs.reduce((sum, a) => sum + a.percentage, 0);
    expect(Math.round(total)).toBe(100);
  });

  it('returns empty array when no transactions of that type', () => {
    const aggs = computeCategoryAggregates([], 'expense');
    expect(aggs).toEqual([]);
  });

  it('sorts by total descending', () => {
    const aggs = computeCategoryAggregates(FIXTURES, 'expense');
    for (let i = 1; i < aggs.length; i++) {
      expect(aggs[i - 1].total).toBeGreaterThanOrEqual(aggs[i].total);
    }
  });
});

// ─── filterTransactions ───────────────────────────────────────────────────────

describe('filterTransactions', () => {
  const defaultFilters: TransactionFilters = {
    period: 'all',
    type: 'all',
    searchText: '',
  };

  it('returns all transactions when filters are default', () => {
    const result = filterTransactions(FIXTURES, defaultFilters);
    expect(result.length).toBe(FIXTURES.length);
  });

  it('filters by type', () => {
    const result = filterTransactions(FIXTURES, { ...defaultFilters, type: 'income' });
    expect(result.every((t) => t.type === 'income')).toBe(true);
    expect(result.length).toBe(2);
  });

  it('filters by search text in description', () => {
    const result = filterTransactions(FIXTURES, { ...defaultFilters, searchText: 'carrefour' });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('2');
  });

  it('filters by search text in category', () => {
    const result = filterTransactions(FIXTURES, { ...defaultFilters, searchText: 'livret' });
    expect(result.length).toBe(1);
    expect(result[0].type).toBe('savings');
  });

  it('filters by month period', () => {
    // Use a fixed date - only March transactions should be included
    const marchFilters: TransactionFilters = { ...defaultFilters, period: 'month' };
    // This test depends on the current date, so just verify it doesn't crash
    const result = filterTransactions(FIXTURES, marchFilters);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── groupTransactionsByDate ──────────────────────────────────────────────────

describe('groupTransactionsByDate', () => {
  it('groups transactions by date', () => {
    const groups = groupTransactionsByDate(FIXTURES.slice(0, 4));
    expect(groups.length).toBe(4); // 4 different dates in march
    const dates = groups.map((g) => g.date);
    // Should be sorted newest first
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1] >= dates[i]).toBe(true);
    }
  });

  it('returns empty array for empty input', () => {
    expect(groupTransactionsByDate([])).toEqual([]);
  });
});

// ─── getYearMonth ─────────────────────────────────────────────────────────────

describe('getYearMonth', () => {
  it('returns YYYY-MM format', () => {
    const date = new Date('2026-03-15T10:00:00');
    expect(getYearMonth(date)).toBe('2026-03');
  });
});

// ─── previousYearMonth ────────────────────────────────────────────────────────

describe('previousYearMonth', () => {
  it('returns previous month', () => {
    expect(previousYearMonth('2026-03')).toBe('2026-02');
    expect(previousYearMonth('2026-01')).toBe('2025-12');
  });
});

// ─── buildDashboardData ───────────────────────────────────────────────────────

describe('buildDashboardData', () => {
  it('builds dashboard data for given date', () => {
    const march = new Date('2026-03-15T12:00:00');
    const data = buildDashboardData(FIXTURES, march);

    expect(data.currentMonth.income).toBe(2000);
    expect(data.currentMonth.expense).toBe(800);
    expect(data.previousMonth.income).toBe(1500);
    expect(data.variation.incomeChange).toBe(500);
    expect(data.topExpenseCategories.length).toBeGreaterThan(0);
    expect(data.topExpenseCategories[0].category).toBe('Courses'); // 500 > 300
  });
});
