import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';
import type { FilterPeriod, TransactionType, TransactionFilters } from '../core/types';

interface FilterBarProps {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
}

const PERIOD_OPTIONS: { label: string; value: FilterPeriod }[] = [
  { label: '7j', value: '7d' },
  { label: '30j', value: '30d' },
  { label: 'Mois', value: 'month' },
  { label: 'Année', value: 'year' },
  { label: 'Tout', value: 'all' },
];

const TYPE_OPTIONS: { label: string; value: TransactionType | 'all' }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Revenus', value: 'income' },
  { label: 'Dépenses', value: 'expense' },
  { label: 'Épargne', value: 'savings' },
];

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const setPeriod = (period: FilterPeriod) =>
    onChange({ ...filters, period });

  const setType = (type: TransactionType | 'all') =>
    onChange({ ...filters, type });

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {PERIOD_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, filters.period === opt.value && styles.chipActive]}
            onPress={() => setPeriod(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: filters.period === opt.value }}
          >
            <Text style={[styles.chipText, filters.period === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {TYPE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, filters.type === opt.value && styles.chipActive]}
            onPress={() => setType(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: filters.type === opt.value }}
          >
            <Text style={[styles.chipText, filters.type === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  row: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.background,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.white,
  },
});
