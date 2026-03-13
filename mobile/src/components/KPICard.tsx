import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';
import { formatCurrency, formatVariation, formatPercent } from '../core/formatters';

interface KPICardProps {
  label: string;
  amount: number;
  change?: number;
  changePercent?: number | null;
  colorType?: 'income' | 'expense' | 'savings' | 'balance';
}

export function KPICard({
  label,
  amount,
  change,
  changePercent,
  colorType = 'balance',
}: KPICardProps) {
  const amountColor = getAmountColor(colorType, amount);
  const isPositiveChange = change !== undefined && change >= 0;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.amount, { color: amountColor }]}>{formatCurrency(amount)}</Text>
      {change !== undefined && (
        <View style={styles.changeRow}>
          <Text style={[styles.changeText, { color: isPositiveChange ? Colors.success : Colors.danger }]}>
            {formatVariation(change)}
          </Text>
          {changePercent !== undefined && (
            <Text style={styles.percentText}> ({formatPercent(changePercent)})</Text>
          )}
        </View>
      )}
    </View>
  );
}

function getAmountColor(type: KPICardProps['colorType'], amount: number): string {
  switch (type) {
    case 'income':
      return Colors.income;
    case 'expense':
      return Colors.expense;
    case 'savings':
      return Colors.savings;
    case 'balance':
      return amount >= 0 ? Colors.income : Colors.expense;
    default:
      return Colors.text;
  }
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    margin: Spacing.xs,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minWidth: 100,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  amount: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  changeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  percentText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
