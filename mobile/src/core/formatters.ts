import type { TransactionType } from './types';

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

/** Formats a number as a Euro currency string (e.g. "1 234,56 €") */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Formats a YYYY-MM-DD string as a French date (e.g. "12 mars 2026") */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const monthName = MONTH_NAMES_FR[month - 1] ?? '';
  return `${day} ${monthName.toLowerCase()} ${year}`;
}

/** Formats a YYYY-MM string as a French month/year (e.g. "Mars 2026") */
export function formatMonthYear(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  return `${MONTH_NAMES_FR[month - 1] ?? ''} ${year}`;
}

/** Returns a short date label for list headers (e.g. "Aujourd'hui", "Hier", or "12 mars") */
export function formatDateHeader(isoDate: string): string {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (isoDate === todayStr) return "Aujourd'hui";
  if (isoDate === yesterdayStr) return 'Hier';
  return formatDate(isoDate);
}

/** Returns a signed change string with arrow (e.g. "↑ +123,45 €" or "↓ -50,00 €") */
export function formatVariation(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${formatCurrency(change)}`;
}

/** Returns a percentage change string (e.g. "+12,5 %" or "N/A") */
export function formatPercent(value: number | null): string {
  if (value === null) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)} %`;
}

/** Returns a human-readable label for a transaction type */
export function formatTransactionType(type: TransactionType): string {
  switch (type) {
    case 'income':
      return 'Revenu';
    case 'expense':
      return 'Dépense';
    case 'savings':
      return 'Épargne';
  }
}

/** Returns today's date as YYYY-MM-DD */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
