import React, { useState, useCallback } from 'react';
import { Modal, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionListScreen } from '../screens/TransactionListScreen';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { useTransactions } from '../hooks/useTransactions';
import { Colors, FontSize } from '../constants/theme';
import type { Transaction, TransactionInput } from '../core/types';

export type TabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export function AppNavigator() {
  const {
    transactions,
    groupedTransactions,
    loading,
    filters,
    setFilters,
    undoTransaction,
    addTransaction,
    editTransaction,
    removeTransaction,
    undoDelete,
    duplicateT,
    dismissUndo,
  } = useTransactions();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);

  const openAdd = useCallback(() => {
    setEditingTransaction(undefined);
    setShowAddModal(true);
  }, []);

  const openEdit = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowAddModal(true);
  }, []);

  const handleSave = useCallback(async (input: TransactionInput) => {
    if (editingTransaction) {
      await editTransaction(editingTransaction.id, input);
    } else {
      await addTransaction(input);
    }
    setShowAddModal(false);
    setEditingTransaction(undefined);
  }, [editingTransaction, addTransaction, editTransaction]);

  const handleCancel = useCallback(() => {
    setShowAddModal(false);
    setEditingTransaction(undefined);
  }, []);

  const goToTransactions = useCallback(() => {
    // Navigate to Transactions tab
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: Colors.textSecondary,
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabBarLabel,
            headerShown: false,
          }}
          screenListeners={() => ({})}
        >
          <Tab.Screen
            name="Dashboard"
            options={{
              tabBarLabel: 'Tableau de bord',
              tabBarIcon: ({ color }) => (
                <TabIcon emoji="📊" color={color} />
              ),
            }}
          >
            {() => (
              <DashboardScreen
                transactions={transactions}
                loading={loading}
                onAddTransaction={openAdd}
                onGoToTransactions={goToTransactions}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="Transactions"
            options={{
              tabBarLabel: 'Transactions',
              tabBarIcon: ({ color }) => (
                <TabIcon emoji="💳" color={color} />
              ),
            }}
          >
            {() => (
              <TransactionListScreen
                groupedTransactions={groupedTransactions}
                loading={loading}
                filters={filters}
                onFiltersChange={setFilters}
                undoTransaction={undoTransaction}
                onAddTransaction={openAdd}
                onEditTransaction={openEdit}
                onDeleteTransaction={removeTransaction}
                onDuplicateTransaction={duplicateT}
                onUndo={undoDelete}
                onDismissUndo={dismissUndo}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>

      {/* Add/Edit modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        <AddTransactionScreen
          transaction={editingTransaction}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </Modal>
    </SafeAreaProvider>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopColor: Colors.border,
    elevation: 8,
    shadowOpacity: 0.1,
    backgroundColor: Colors.card,
  },
  tabBarLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
