import {
  formatCurrency,
  formatDate,
  formatMonthYear,
  formatDateHeader,
  formatVariation,
  formatPercent,
  formatTransactionType,
  todayISO,
} from '../../src/core/formatters';

describe('formatCurrency', () => {
  it('formats positive amounts', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1');
    expect(result).toContain('€');
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
    expect(result).toContain('€');
  });

  it('formats negative amounts', () => {
    const result = formatCurrency(-100);
    expect(result).toContain('€');
  });
});

describe('formatDate', () => {
  it('formats YYYY-MM-DD as French date', () => {
    const result = formatDate('2026-03-12');
    expect(result).toContain('12');
    expect(result).toContain('2026');
    // Should contain month name in French
    expect(result.toLowerCase()).toContain('mars');
  });

  it('formats January correctly', () => {
    const result = formatDate('2026-01-05');
    expect(result.toLowerCase()).toContain('janvier');
  });
});

describe('formatMonthYear', () => {
  it('formats YYYY-MM as French month/year', () => {
    const result = formatMonthYear('2026-03');
    expect(result).toContain('2026');
    expect(result).toContain('Mars');
  });
});

describe('formatDateHeader', () => {
  it("returns Aujourd'hui for today", () => {
    const today = new Date().toISOString().split('T')[0];
    expect(formatDateHeader(today)).toBe("Aujourd'hui");
  });

  it('returns Hier for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    expect(formatDateHeader(yesterdayStr)).toBe('Hier');
  });

  it('returns formatted date for older dates', () => {
    const result = formatDateHeader('2024-06-15');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });
});

describe('formatVariation', () => {
  it('formats positive variation with + sign', () => {
    const result = formatVariation(100);
    expect(result).toContain('+');
  });

  it('formats negative variation with - sign', () => {
    const result = formatVariation(-50);
    expect(result).not.toContain('+');
    expect(result).toContain('€');
  });

  it('formats zero with + sign', () => {
    const result = formatVariation(0);
    expect(result).toContain('+');
  });
});

describe('formatPercent', () => {
  it('returns N/A for null', () => {
    expect(formatPercent(null)).toBe('N/A');
  });

  it('formats positive percentage with + sign', () => {
    const result = formatPercent(12.5);
    expect(result).toContain('+');
    expect(result).toContain('%');
  });

  it('formats negative percentage', () => {
    const result = formatPercent(-10);
    expect(result).not.toContain('+');
    expect(result).toContain('%');
  });
});

describe('formatTransactionType', () => {
  it('returns Revenu for income', () => {
    expect(formatTransactionType('income')).toBe('Revenu');
  });

  it('returns Dépense for expense', () => {
    expect(formatTransactionType('expense')).toBe('Dépense');
  });

  it('returns Épargne for savings', () => {
    expect(formatTransactionType('savings')).toBe('Épargne');
  });

  it('returns Crédit for credit', () => {
    expect(formatTransactionType('credit')).toBe('Crédit');
  });
});

describe('todayISO', () => {
  it('returns today in YYYY-MM-DD format', () => {
    const result = todayISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const today = new Date().toISOString().split('T')[0];
    expect(result).toBe(today);
  });
});
