import { startSmsListener, stopSmsListener } from './smsReader';
import { parseSmsToTransaction } from './smsParser';
import { insertTransaction, transactionExists } from '../db/db';
import { useTransactionStore } from '../store/transactionStore';
import { Transaction } from '../types/transaction';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTO_CONFIRM_KEY = 'sms_auto_confirm';
const PENDING_TRANSACTIONS_KEY = 'pending_transactions';

/**
 * Get auto-confirm setting
 */
export const getAutoConfirmSetting = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(AUTO_CONFIRM_KEY);
    return value !== 'false'; // Default to true
  } catch (error) {
    console.error('Error reading auto-confirm setting:', error);
    return true; // Default to true
  }
};

/**
 * Set auto-confirm setting
 */
export const setAutoConfirmSetting = async (value: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(AUTO_CONFIRM_KEY, value.toString());
  } catch (error) {
    console.error('Error saving auto-confirm setting:', error);
  }
};

/**
 * Get pending transactions
 */
export const getPendingTransactions = async (): Promise<Transaction[]> => {
  try {
    const value = await AsyncStorage.getItem(PENDING_TRANSACTIONS_KEY);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.error('Error reading pending transactions:', error);
    return [];
  }
};

/**
 * Add transaction to pending queue
 */
export const addPendingTransaction = async (
  transaction: Transaction
): Promise<void> => {
  try {
    const pending = await getPendingTransactions();
    pending.push(transaction);
    await AsyncStorage.setItem(
      PENDING_TRANSACTIONS_KEY,
      JSON.stringify(pending)
    );
  } catch (error) {
    console.error('Error adding pending transaction:', error);
  }
};

/**
 * Remove transaction from pending queue
 */
export const removePendingTransaction = async (id: string): Promise<void> => {
  try {
    const pending = await getPendingTransactions();
    const filtered = pending.filter((tx) => tx.id !== id);
    await AsyncStorage.setItem(
      PENDING_TRANSACTIONS_KEY,
      JSON.stringify(filtered)
    );
  } catch (error) {
    console.error('Error removing pending transaction:', error);
  }
};

/**
 * Process incoming SMS and either auto-confirm or add to pending queue
 */
const processIncomingSms = async (
  sender: string,
  body: string
): Promise<void> => {
  try {
    // Parse SMS to transaction
    const transaction = parseSmsToTransaction(sender, body);
    if (!transaction) {
      console.log('SMS could not be parsed as transaction');
      return;
    }

    // Check for duplicates
    const exists = await transactionExists(transaction.id);
    if (exists) {
      console.log('Transaction already exists:', transaction.id);
      return;
    }

    // Check auto-confirm setting
    const autoConfirm = await getAutoConfirmSetting();

    if (autoConfirm) {
      // Auto-confirm: insert directly to DB
      await insertTransaction(transaction);
      useTransactionStore.getState().addTransaction(transaction);
      console.log('Transaction auto-confirmed and inserted:', transaction.id);
    } else {
      // Add to pending queue
      await addPendingTransaction(transaction);
      console.log('Transaction added to pending queue:', transaction.id);
    }
  } catch (error) {
    console.error('Error processing incoming SMS:', error);
  }
};

/**
 * Initialize SMS service
 */
export const initSmsService = async (): Promise<void> => {
  try {
    await startSmsListener(processIncomingSms);
    console.log('SMS service initialized');
  } catch (error) {
    console.error('Error initializing SMS service:', error);
  }
};

/**
 * Stop SMS service
 */
export const stopSmsService = (): void => {
  stopSmsListener();
  console.log('SMS service stopped');
};

