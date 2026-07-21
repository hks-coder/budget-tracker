export const Colors = {
  // Brand
  primary: '#2ecc71',
  primaryDark: '#27ae60',
  secondary: '#3498db',

  // Transaction types
  income: '#27ae60',
  expense: '#e74c3c',
  savings: '#3498db',

  // UI
  background: '#f5f5f5',
  card: '#ffffff',
  border: '#e0e0e0',
  text: '#2c3e50',
  textSecondary: '#7f8c8d',
  textLight: '#95a5a6',

  // Status
  success: '#2ecc71',
  warning: '#f39c12',
  danger: '#e74c3c',

  // Misc
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 20,
  round: 999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;

export const SETTINGS_KEYS = {
  LAST_TYPE: 'last_transaction_type',
  LAST_EXPENSE_CATEGORY: 'last_expense_category',
  LAST_INCOME_CATEGORY: 'last_income_category',
  LAST_SAVINGS_CATEGORY: 'last_savings_category',
} as const;
