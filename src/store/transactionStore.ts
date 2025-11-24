import { create } from 'zustand';
import { Transaction } from '../types/transaction';
import {
  fetchTransactions,
  fetchTransactionsByMonth,
} from '../db/db';

interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  refreshFromDb: () => Promise<void>;
  getMonthlyExpenses: (year: number, month: number) => number;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  isLoading: false,

  setTransactions: (transactions: Transaction[]) => {
    set({ transactions });
  },

  addTransaction: (transaction: Transaction) => {
    const { transactions } = get();
    // Add to beginning of array (newest first)
    set({ transactions: [transaction, ...transactions] });
  },

  refreshFromDb: async () => {
    set({ isLoading: true });
    try {
      const transactions = await fetchTransactions();
      set({ transactions, isLoading: false });
    } catch (error) {
      console.error('Error refreshing transactions from DB:', error);
      set({ isLoading: false });
    }
  },

  getMonthlyExpenses: (year: number, month: number): number => {
    const { transactions } = get();
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    return transactions
      .filter((tx) => {
        const txDate = new Date(tx.date);
        return (
          txDate.getFullYear() === targetYear &&
          txDate.getMonth() + 1 === targetMonth &&
          tx.type === 'debit'
        );
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  },
}));


