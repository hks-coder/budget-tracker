import { validateTransaction } from '../../src/core/validation';
import type { TransactionInput } from '../../src/core/types';

const validInput: TransactionInput = {
  type: 'expense',
  amount: 100,
  category: 'Courses',
  description: 'Test purchase',
  date: '2026-03-10',
};

describe('validateTransaction', () => {
  it('returns valid for a correct input', () => {
    const result = validateTransaction(validInput);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // ─── Amount ─────────────────────────────────────────────────────────────

  describe('amount', () => {
    it('rejects zero amount', () => {
      const result = validateTransaction({ ...validInput, amount: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'amount')).toBe(true);
    });

    it('rejects negative amount', () => {
      const result = validateTransaction({ ...validInput, amount: -50 });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'amount')).toBe(true);
    });

    it('rejects amount above max', () => {
      const result = validateTransaction({ ...validInput, amount: 1_000_000_000 });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'amount')).toBe(true);
    });

    it('rejects NaN amount', () => {
      const result = validateTransaction({ ...validInput, amount: NaN });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'amount')).toBe(true);
    });

    it('accepts maximum valid amount', () => {
      const result = validateTransaction({ ...validInput, amount: 999_999_999 });
      expect(result.valid).toBe(true);
    });

    it('accepts small valid amount', () => {
      const result = validateTransaction({ ...validInput, amount: 0.01 });
      expect(result.valid).toBe(true);
    });
  });

  // ─── Type ────────────────────────────────────────────────────────────────

  describe('type', () => {
    it('accepts income', () => {
      const result = validateTransaction({ ...validInput, type: 'income' });
      expect(result.valid).toBe(true);
    });

    it('accepts expense', () => {
      const result = validateTransaction({ ...validInput, type: 'expense' });
      expect(result.valid).toBe(true);
    });

    it('accepts savings', () => {
      const result = validateTransaction({ ...validInput, type: 'savings' });
      expect(result.valid).toBe(true);
    });

    it('rejects invalid type', () => {
      const result = validateTransaction({ ...validInput, type: 'invalid' as never });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'type')).toBe(true);
    });

    it('rejects legacy credit type', () => {
      const result = validateTransaction({ ...validInput, type: 'credit' as never });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'type')).toBe(true);
    });
  });

  // ─── Category ────────────────────────────────────────────────────────────

  describe('category', () => {
    it('rejects empty category', () => {
      const result = validateTransaction({ ...validInput, category: '' });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'category')).toBe(true);
    });

    it('rejects category exceeding 100 characters', () => {
      const result = validateTransaction({ ...validInput, category: 'a'.repeat(101) });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'category')).toBe(true);
    });

    it('accepts category at max length', () => {
      const result = validateTransaction({ ...validInput, category: 'a'.repeat(100) });
      expect(result.valid).toBe(true);
    });
  });

  // ─── Description ─────────────────────────────────────────────────────────

  describe('description', () => {
    it('rejects empty description', () => {
      const result = validateTransaction({ ...validInput, description: '' });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'description')).toBe(true);
    });

    it('rejects description exceeding 200 characters', () => {
      const result = validateTransaction({ ...validInput, description: 'a'.repeat(201) });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'description')).toBe(true);
    });

    it('accepts description at max length', () => {
      const result = validateTransaction({ ...validInput, description: 'a'.repeat(200) });
      expect(result.valid).toBe(true);
    });
  });

  // ─── Date ────────────────────────────────────────────────────────────────

  describe('date', () => {
    it('rejects empty date', () => {
      const result = validateTransaction({ ...validInput, date: '' });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'date')).toBe(true);
    });

    it('rejects invalid date format', () => {
      const result = validateTransaction({ ...validInput, date: '10/03/2026' });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'date')).toBe(true);
    });

    it('rejects year before 2000', () => {
      const result = validateTransaction({ ...validInput, date: '1999-12-31' });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'date')).toBe(true);
    });

    it('rejects year after 2100', () => {
      const result = validateTransaction({ ...validInput, date: '2101-01-01' });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'date')).toBe(true);
    });

    it('accepts valid date at boundary (2000-01-01)', () => {
      const result = validateTransaction({ ...validInput, date: '2000-01-01' });
      expect(result.valid).toBe(true);
    });

    it('accepts valid date at boundary (2100-12-31)', () => {
      const result = validateTransaction({ ...validInput, date: '2100-12-31' });
      expect(result.valid).toBe(true);
    });
  });

  // ─── Multiple errors ──────────────────────────────────────────────────────

  it('returns multiple errors for multiple invalid fields', () => {
    const result = validateTransaction({
      type: 'expense',
      amount: -1,
      category: '',
      description: '',
      date: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});
