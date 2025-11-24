export type TransactionType = 'debit' | 'credit';
export type TransactionSource = 'sms' | 'manual';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  date: string; // ISO string
  description: string;
  bank: string;
  source: TransactionSource;
  createdAt: string;
  updatedAt: string;
}


