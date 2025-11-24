import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTransactionStore } from '../store/transactionStore';
import { Transaction } from '../types/transaction';

const Transactions = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { transactions, isLoading, refreshFromDb } = useTransactionStore();

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshFromDb();
    }, [refreshFromDb])
  );

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

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isDebit = item.type === 'debit';

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <Text style={styles.transactionBank}>{item.bank}</Text>
          <Text style={styles.transactionDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.transactionMeta}>
            <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
            <Text style={styles.transactionSource}>
              {item.source === 'sms' ? '📱 SMS' : '✏️ Manual'}
            </Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text
            style={[
              styles.transactionAmount,
              isDebit ? styles.debitAmount : styles.creditAmount,
            ]}
          >
            {isDebit ? '-' : '+'}
            {formatCurrency(item.amount)}
          </Text>
          <Text style={styles.transactionType}>
            {item.type === 'debit' ? 'Debit' : 'Credit'}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No transactions found</Text>
        <Text style={styles.emptyStateSubtext}>
          Add an expense manually or wait for SMS transactions to be captured
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddExpense' as never)}
        >
          <Text style={styles.addButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Transactions</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddExpense' as never)}
        >
          <Text style={styles.addButtonHeader}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          transactions.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshFromDb} />
        }
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButtonHeader: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  transactionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginBottom: 8,
  },
  transactionMeta: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionSource: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  debitAmount: {
    color: '#FF3B30',
  },
  creditAmount: {
    color: '#34C759',
  },
  transactionType: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Transactions;
