import SQLite from 'react-native-sqlite-2';
import { Transaction } from '../types/transaction';

let db: SQLite.SQLiteDatabase | null = null;

const DB_NAME = 'smart_expense.db';

/**
 * Initialize the database and create tables
 */
export const initDb = async (): Promise<void> => {
  try {
    db = SQLite.openDatabase(DB_NAME, '1.0', '', 1);
    
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      db.transaction(
        (tx) => {
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS transactions (
              id TEXT PRIMARY KEY,
              amount REAL NOT NULL,
              type TEXT NOT NULL CHECK(type IN ('debit', 'credit')),
              date TEXT NOT NULL,
              description TEXT,
              bank TEXT,
              source TEXT NOT NULL CHECK(source IN ('sms', 'manual')),
              createdAt TEXT NOT NULL,
              updatedAt TEXT NOT NULL
            )`,
            [],
            () => {
              console.log('Database initialized successfully');
            },
            (_, error) => {
              console.error('Error creating transactions table:', error);
              return false;
            }
          );
        },
        (error) => {
          console.error('Transaction error:', error);
          reject(error);
        },
        () => {
          console.log('Transaction completed');
          resolve();
        }
      );
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

/**
 * Insert a transaction into the database
 * Uses OR IGNORE to handle duplicates
 */
export const insertTransaction = async (
  tx: Transaction
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.transaction((transaction) => {
      transaction.executeSql(
        `INSERT OR IGNORE INTO transactions 
         (id, amount, type, date, description, bank, source, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tx.id,
          tx.amount,
          tx.type,
          tx.date,
          tx.description,
          tx.bank,
          tx.source,
          tx.createdAt,
          tx.updatedAt,
        ],
        (_, result) => {
          if (result.rowsAffected > 0) {
            console.log('Transaction inserted:', tx.id);
          } else {
            console.log('Transaction already exists (duplicate):', tx.id);
          }
          resolve();
        },
        (_, error) => {
          console.error('Error inserting transaction:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Fetch transactions with pagination
 */
export const fetchTransactions = async (
  limit: number = 100,
  offset: number = 0
): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM transactions 
         ORDER BY date DESC, createdAt DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset],
        (_, result) => {
          const transactions: Transaction[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            transactions.push(result.rows.item(i) as Transaction);
          }
          resolve(transactions);
        },
        (_, error) => {
          console.error('Error fetching transactions:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Fetch transactions for a specific month
 */
export const fetchTransactionsByMonth = async (
  year: number,
  month: number
): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    // Month is 0-indexed in JavaScript Date, but we pass 1-indexed
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM transactions 
         WHERE date >= ? AND date <= ?
         ORDER BY date DESC, createdAt DESC`,
        [startDate, endDate],
        (_, result) => {
          const transactions: Transaction[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            transactions.push(result.rows.item(i) as Transaction);
          }
          resolve(transactions);
        },
        (_, error) => {
          console.error('Error fetching transactions by month:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Check if a transaction with given ID exists
 */
export const transactionExists = async (id: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.transaction((tx) => {
      tx.executeSql(
        `SELECT COUNT(*) as count FROM transactions WHERE id = ?`,
        [id],
        (_, result) => {
          const count = result.rows.item(0).count;
          resolve(count > 0);
        },
        (_, error) => {
          console.error('Error checking transaction existence:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

