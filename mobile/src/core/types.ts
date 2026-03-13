// Core types for Budget Tracker mobile app

export type TransactionType = 'income' | 'expense' | 'savings';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO date string YYYY-MM-DD
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface MonthlyTotals {
  income: number;
  expense: number;
  savings: number;
  balance: number;
}

export interface MonthlyVariation {
  incomeChange: number;
  expenseChange: number;
  balanceChange: number;
  incomeChangePercent: number | null;
  expenseChangePercent: number | null;
  balanceChangePercent: number | null;
}

export interface CategoryAggregate {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface DashboardData {
  currentMonth: MonthlyTotals;
  previousMonth: MonthlyTotals;
  variation: MonthlyVariation;
  topExpenseCategories: CategoryAggregate[];
}

export type FilterPeriod = '7d' | '30d' | 'month' | 'year' | 'all';

export interface TransactionFilters {
  period: FilterPeriod;
  type: TransactionType | 'all';
  searchText: string;
}

export interface CategoryBudget {
  id: string;
  category: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

// Expense categories (matching web app)
export const EXPENSE_CATEGORIES = [
  'Courses',
  'Appartement',
  'Appartement > Box',
  'Appartement > SFR',
  'Shopping',
  'Transport',
  'Loisirs',
  'Loisirs > Restaurant',
  'Santé',
  'Éducation',
  'Frais Bancaire',
  'Facture',
  'Autre',
] as const;

// Income categories (matching web app)
export const INCOME_CATEGORIES = [
  'Salaire',
  'Freelance',
  'Investissement',
  'Cadeau',
  'Autre',
] as const;

// Savings categories (matching web app)
export const SAVINGS_CATEGORIES = [
  'Livret A',
  'PEA',
  'Assurance Vie',
  'Trade Republic',
  'Trading',
  'Autre',
] as const;

export function getCategoriesForType(type: TransactionType): readonly string[] {
  switch (type) {
    case 'income':
      return INCOME_CATEGORIES;
    case 'expense':
      return EXPENSE_CATEGORIES;
    case 'savings':
      return SAVINGS_CATEGORIES;
  }
}
