import { useMemo } from 'react';
import type { Transaction } from '../core/types';
import { buildDashboardData } from '../core/calculations';
import type { DashboardData } from '../core/types';

export function useDashboard(transactions: Transaction[]): DashboardData {
  return useMemo(() => buildDashboardData(transactions), [transactions]);
}
