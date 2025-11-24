import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getPendingTransactions,
  removePendingTransaction,
} from '../services/smsService';
import { insertTransaction } from '../db/db';
import { useTransactionStore } from '../store/transactionStore';
import { Transaction } from '../types/transaction';

const PendingTransactions = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const { addTransaction } = useTransactionStore();

  useEffect(() => {
    loadPendingTransactions();
  }, []);

  const loadPendingTransactions = async () => {
    try {
      const transactions = await getPendingTransactions();
      setPendingTransactions(transactions);
    } catch (error) {
      console.error('Error loading pending transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (transaction: Transaction) => {
    try {
      await insertTransaction(transaction);
      await removePendingTransaction(transaction.id);
      addTransaction(transaction);
      await loadPendingTransactions();
      Alert.alert('Success', 'Transaction confirmed and added');
    } catch (error) {
      console.error('Error confirming transaction:', error);
      Alert.alert('Error', 'Failed to confirm transaction');
    }
  };

  const handleReject = async (transaction: Transaction) => {
    Alert.alert(
      'Reject Transaction',
      'Are you sure you want to reject this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await removePendingTransaction(transaction.id);
              await loadPendingTransactions();
            } catch (error) {
              console.error('Error rejecting transaction:', error);
              Alert.alert('Error', 'Failed to reject transaction');
            }
          },
        },
      ]
    );
  };

  const formatAmount = (amount: number): string => {
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

  const getTransactionColor = (type: string): string => {
    return type === 'debit' ? '#e74c3c' : '#27ae60';
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionBank}>{item.bank}</Text>
          <Text
            style={[
              styles.transactionAmount,
              { color: getTransactionColor(item.type) },
            ]}
          >
            {item.type === 'debit' ? '-' : '+'}
            {formatAmount(item.amount)}
          </Text>
        </View>
        <Text style={styles.transactionDesc}>{item.description}</Text>
        <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item)}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={() => handleConfirm(item)}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No pending transactions</Text>
        <Text style={styles.emptySubtext}>
          All transactions have been reviewed
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pending Transactions</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={pendingTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          pendingTransactions.length === 0 ? styles.emptyContainer : styles.listContainer
        }
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  transactionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionBank: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  transactionAmount: {
    fontSize: 20,
    fontWeight: '600',
  },
  transactionDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#ffe5e5',
  },
  rejectButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#e5f5ed',
  },
  confirmButtonText: {
    color: '#27ae60',
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    height: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
  },
});

export default PendingTransactions;

