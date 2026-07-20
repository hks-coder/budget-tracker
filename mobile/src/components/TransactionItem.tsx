import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';
import { formatCurrency, formatTransactionType } from '../core/formatters';
import type { Transaction } from '../core/types';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function TransactionItem({
  transaction,
  onEdit,
  onDelete,
  onDuplicate,
}: TransactionItemProps) {
  const typeColor = getTypeColor(transaction.type);

  const handleLongPress = () => {
    Alert.alert(
      'Actions',
      `${transaction.description}`,
      [
        { text: 'Modifier', onPress: () => onEdit(transaction) },
        { text: 'Dupliquer', onPress: () => onDuplicate(transaction.id) },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => confirmDelete(transaction),
        },
        { text: 'Annuler', style: 'cancel' },
      ],
    );
  };

  const confirmDelete = (t: Transaction) => {
    Alert.alert(
      'Supprimer',
      `Supprimer "${t.description}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(t.id) },
      ],
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onLongPress={handleLongPress}
      onPress={() => onEdit(transaction)}
      accessibilityLabel={`${formatTransactionType(transaction.type)}: ${transaction.description}, ${formatCurrency(transaction.amount)}`}
    >
      <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
        <Text style={styles.typeBadgeText}>{typeIcon(transaction.type)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {transaction.category}
        </Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: typeColor }]}>
          {transaction.type === 'expense' ? '−' : '+'}{formatCurrency(transaction.amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function typeIcon(type: Transaction['type']): string {
  switch (type) {
    case 'income': return '↑';
    case 'expense': return '↓';
    case 'savings': return '🏦';
    case 'credit': return '↩️';
  }
}

function getTypeColor(type: Transaction['type']): string {
  switch (type) {
    case 'income': return Colors.income;
    case 'expense': return Colors.expense;
    case 'savings': return Colors.savings;
    case 'credit': return Colors.credit;
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  typeBadge: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  typeBadgeText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  category: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
