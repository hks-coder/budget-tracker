import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KPICard } from '../components/KPICard';
import { FAB } from '../components/FAB';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { useDashboard } from '../hooks/useDashboard';
import { formatCurrency, formatMonthYear } from '../core/formatters';
import type { Transaction } from '../core/types';
import { getYearMonth } from '../core/calculations';

interface DashboardScreenProps {
  transactions: Transaction[];
  loading: boolean;
  onAddTransaction: () => void;
  onGoToTransactions: () => void;
}

export function DashboardScreen({
  transactions,
  loading,
  onAddTransaction,
  onGoToTransactions,
}: DashboardScreenProps) {
  const dashboard = useDashboard(transactions);
  const currentYM = getYearMonth(new Date());

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const { currentMonth, variation, topExpenseCategories } = dashboard;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💰 Budget Tracker</Text>
          <Text style={styles.headerSubtitle}>{formatMonthYear(currentYM)}</Text>
        </View>

        {/* KPI Row 1: Balance */}
        <View style={styles.kpiRow}>
          <KPICard
            label="Solde"
            amount={currentMonth.balance}
            change={variation.balanceChange}
            changePercent={variation.balanceChangePercent}
            colorType="balance"
          />
        </View>

        {/* KPI Row 2: Income + Expense */}
        <View style={styles.kpiRow}>
          <KPICard
            label="Revenus"
            amount={currentMonth.income}
            change={variation.incomeChange}
            changePercent={variation.incomeChangePercent}
            colorType="income"
          />
          <KPICard
            label="Dépenses"
            amount={currentMonth.expense}
            change={variation.expenseChange}
            changePercent={variation.expenseChangePercent}
            colorType="expense"
          />
          <KPICard
            label="Épargne"
            amount={currentMonth.savings}
            colorType="savings"
          />
        </View>

        {/* Top categories */}
        {topExpenseCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Top dépenses par catégorie</Text>
            {topExpenseCategories.map((cat) => (
              <View key={cat.category} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{cat.category}</Text>
                  <Text style={styles.categoryCount}>{cat.count} transaction(s)</Text>
                </View>
                <View style={styles.categoryAmountContainer}>
                  <Text style={styles.categoryAmount}>{formatCurrency(cat.total)}</Text>
                  <Text style={styles.categoryPercent}>{cat.percentage.toFixed(0)}%</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {transactions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📊</Text>
            <Text style={styles.emptyStateTitle}>Aucune transaction</Text>
            <Text style={styles.emptyStateText}>
              Commencez par ajouter votre première transaction en appuyant sur le bouton +
            </Text>
            <TouchableOpacity style={styles.emptyStateBtn} onPress={onAddTransaction}>
              <Text style={styles.emptyStateBtnText}>➕ Ajouter une transaction</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* View all link */}
        {transactions.length > 0 && (
          <TouchableOpacity style={styles.viewAllBtn} onPress={onGoToTransactions}>
            <Text style={styles.viewAllText}>Voir toutes les transactions →</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <FAB onPress={onAddTransaction} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md },
  header: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryInfo: { flex: 1 },
  categoryName: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  categoryCount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  categoryAmountContainer: { alignItems: 'flex-end' },
  categoryAmount: {
    fontSize: FontSize.sm,
    color: Colors.expense,
    fontWeight: '700',
  },
  categoryPercent: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyStateIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyStateTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  emptyStateBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.round,
  },
  emptyStateBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  viewAllBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  viewAllText: {
    color: Colors.secondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
