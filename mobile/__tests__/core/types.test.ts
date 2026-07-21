import {
  EXPENSE_CATEGORIES,
  getCategoriesForType,
  isTransactionType,
} from '../../src/core/types';

describe('expense categories', () => {
  it('includes the loan-related categories', () => {
    expect(EXPENSE_CATEGORIES).toContain('credit de voiture');
    expect(EXPENSE_CATEGORIES).toContain('credit immobilier');
  });

  it('returns the expense categories for expense transactions', () => {
    expect(getCategoriesForType('expense')).toContain('credit de voiture');
    expect(getCategoriesForType('expense')).toContain('credit immobilier');
  });
});

describe('isTransactionType', () => {
  it('rejects legacy credit values', () => {
    expect(isTransactionType('credit')).toBe(false);
  });
});
