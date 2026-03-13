import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionItem } from '../components/TransactionItem';
import { FilterBar } from '../components/FilterBar';
import { FAB } from '../components/FAB';
import { UndoSnackbar } from '../components/UndoSnackbar';
import { Colors, Spacing, FontSize } from '../constants/theme';
import { formatDateHeader } from '../core/formatters';
import type { Transaction, TransactionFilters } from '../core/types';

interface TransactionListScreenProps {
  groupedTransactions: { date: string; transactions: Transaction[] }[];
  loading: boolean;
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  undoTransaction: Transaction | null;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onDuplicateTransaction: (id: string) => void;
  onUndo: () => void;
  onDismissUndo: () => void;
}

interface ListItem {
  type: 'header' | 'transaction';
  date?: string;
  transaction?: Transaction;
  key: string;
}

function buildFlatData(
  groups: { date: string; transactions: Transaction[] }[],
): ListItem[] {
  const items: ListItem[] = [];
  for (const group of groups) {
    items.push({ type: 'header', date: group.date, key: `header_${group.date}` });
    for (const t of group.transactions) {
      items.push({ type: 'transaction', transaction: t, key: t.id });
    }
  }
  return items;
}

export function TransactionListScreen({
  groupedTransactions,
  loading,
  filters,
  onFiltersChange,
  undoTransaction,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onDuplicateTransaction,
  onUndo,
  onDismissUndo,
}: TransactionListScreenProps) {
  const [searchText, setSearchText] = useState(filters.searchText);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);
      onFiltersChange({ ...filters, searchText: text });
    },
    [filters, onFiltersChange],
  );

  const flatData = buildFlatData(groupedTransactions);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'header') {
        return (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>
              {formatDateHeader(item.date!)}
            </Text>
          </View>
        );
      }
      const t = item.transaction!;
      return (
        <TransactionItem
          transaction={t}
          onEdit={onEditTransaction}
          onDelete={onDeleteTransaction}
          onDuplicate={onDuplicateTransaction}
        />
      );
    },
    [onEditTransaction, onDeleteTransaction, onDuplicateTransaction],
  );

  const keyExtractor = useCallback((item: ListItem) => item.key, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: 56,
      offset: 56 * index,
      index,
    }),
    [],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Rechercher..."
          placeholderTextColor={Colors.textLight}
          value={searchText}
          onChangeText={handleSearchChange}
          clearButtonMode="while-editing"
          accessibilityLabel="Rechercher des transactions"
        />
      </View>

      {/* Filter bar */}
      <FilterBar filters={filters} onChange={onFiltersChange} />

      {/* Transactions list */}
      {flatData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🔍</Text>
          <Text style={styles.emptyStateTitle}>Aucune transaction</Text>
          <Text style={styles.emptyStateText}>
            {filters.searchText
              ? 'Aucun résultat pour votre recherche.'
              : 'Aucune transaction pour la période sélectionnée.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={flatData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          removeClippedSubviews
          maxToRenderPerBatch={20}
          windowSize={10}
          initialNumToRender={20}
          style={styles.list}
        />
      )}

      <FAB onPress={onAddTransaction} />

      <UndoSnackbar
        visible={!!undoTransaction}
        message={
          undoTransaction
            ? `"${undoTransaction.description}" supprimé`
            : ''
        }
        onUndo={onUndo}
        onDismiss={onDismissUndo}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  searchContainer: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    height: 40,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  list: { flex: 1 },
  dateHeader: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dateHeaderText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
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
  },
});
