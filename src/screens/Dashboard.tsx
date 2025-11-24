import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTransactionStore } from '../store/transactionStore';
import { Transaction } from '../types/transaction';

const Dashboard = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { transactions, isLoading, refreshFromDb, getMonthlyExpenses } =
    useTransactionStore();

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshFromDb();
    }, [refreshFromDb])
  );

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthlyExpenses = getMonthlyExpenses(currentYear, currentMonth);

  // Get last 5 transactions
  const last5Transactions = transactions.slice(0, 5);

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatMonth = (month: number): string => {
    const date = new Date(2024, month - 1, 1);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshFromDb} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Smart Expense</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings' as never)}
          >
            <Text style={styles.settingsButton}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Monthly Expenses Card */}
        <View style={styles.expenseCard}>
          <Text style={styles.expenseLabel}>Monthly Expenses</Text>
          <Text style={styles.expenseMonth}>{formatMonth(currentMonth)}</Text>
          <Text style={styles.expenseAmount}>
            {formatCurrency(monthlyExpenses)}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddExpense' as never)}
          >
            <Text style={styles.actionButtonText}>+ Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => navigation.navigate('Transactions' as never)}
          >
            <Text style={styles.actionButtonTextSecondary}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Last 5 Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {last5Transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add an expense or wait for SMS transactions
              </Text>
            </View>
          ) : (
            last5Transactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const isDebit = transaction.type === 'debit';

  return (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <Text style={styles.transactionBank}>{transaction.bank}</Text>
        <Text style={styles.transactionDescription} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
      </View>
      <View style={styles.transactionRight}>
        <Text
          style={[
            styles.transactionAmount,
            isDebit ? styles.debitAmount : styles.creditAmount,
          ]}
        >
          {isDebit ? '-' : '+'}
          {formatCurrency(transaction.amount)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    fontSize: 24,
  },
  expenseCard: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  expenseLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 4,
  },
  expenseMonth: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 8,
  },
  expenseAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  transactionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flex: 1,
    marginRight: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionBank: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  debitAmount: {
    color: '#FF3B30',
  },
  creditAmount: {
    color: '#34C759',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default Dashboard;
