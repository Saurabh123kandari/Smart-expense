import { Transaction, TransactionType } from '../types/transaction';

/**
 * Parse SMS text into a Transaction object
 * Supports common Indian bank SMS formats
 */
export const parseSmsToTransaction = (
  sender: string,
  body: string
): Transaction | null => {
  try {
    // Extract amount - supports INR, Rs, ₹ with decimal
    const amountRegex = /(?:INR|Rs|₹)\s*([\d,]+\.?\d*)/gi;
    const amountMatch = body.match(amountRegex);
    if (!amountMatch || amountMatch.length === 0) {
      return null; // No amount found, not a transaction SMS
    }

    // Get the first amount match and clean it
    const amountStr = amountMatch[0]
      .replace(/INR|Rs|₹/gi, '')
      .replace(/,/g, '')
      .trim();
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      return null;
    }

    // Determine transaction type (debit/credit)
    const bodyLower = body.toLowerCase();
    const debitKeywords = [
      'debited',
      'spent',
      'withdrawn',
      'paid',
      'purchase',
      'purchased',
      'transaction',
    ];
    const creditKeywords = [
      'credited',
      'received',
      'deposited',
      'refund',
      'refunded',
    ];

    let type: TransactionType = 'debit'; // default
    const hasDebit = debitKeywords.some((keyword) =>
      bodyLower.includes(keyword)
    );
    const hasCredit = creditKeywords.some((keyword) =>
      bodyLower.includes(keyword)
    );

    if (hasCredit && !hasDebit) {
      type = 'credit';
    } else if (hasDebit && !hasCredit) {
      type = 'debit';
    } else if (hasCredit && hasDebit) {
      // If both present, check context - usually the first one is the transaction type
      const creditIndex = bodyLower.indexOf('credit');
      const debitIndex = bodyLower.indexOf('debit');
      type = creditIndex < debitIndex ? 'credit' : 'debit';
    }

    // Extract date - try multiple formats
    let transactionDate = new Date();
    const dateFormats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/g, // DD/MM/YYYY
      /(\d{1,2})-(\d{1,2})-(\d{4})/g, // DD-MM-YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/g, // YYYY-MM-DD
    ];

    for (const format of dateFormats) {
      const dateMatch = body.match(format);
      if (dateMatch) {
        const dateStr = dateMatch[0];
        if (format === dateFormats[0] || format === dateFormats[1]) {
          // DD/MM/YYYY or DD-MM-YYYY
          const parts = dateStr.split(/[\/-]/);
          if (parts.length === 3) {
            transactionDate = new Date(
              parseInt(parts[2]),
              parseInt(parts[1]) - 1,
              parseInt(parts[0])
            );
            break;
          }
        } else {
          // YYYY-MM-DD
          transactionDate = new Date(dateStr);
          break;
        }
      }
    }

    // If no date found, check for relative dates
    if (bodyLower.includes('today')) {
      transactionDate = new Date();
    } else if (bodyLower.includes('yesterday')) {
      transactionDate = new Date();
      transactionDate.setDate(transactionDate.getDate() - 1);
    }

    // Extract bank name from sender (usually a short code or bank name)
    const bank = extractBankName(sender);

    // Generate transaction ID (deterministic for duplicate detection)
    const timestamp = transactionDate.getTime();
    const id = generateTransactionId(sender, amount, timestamp);

    // Create description from SMS body (first 100 chars)
    const description = body.substring(0, 100).trim();

    const now = new Date().toISOString();

    return {
      id,
      amount,
      type,
      date: transactionDate.toISOString(),
      description,
      bank,
      source: 'sms',
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error('Error parsing SMS:', error);
    return null;
  }
};

/**
 * Extract bank name from sender number/string
 */
const extractBankName = (sender: string): string => {
  // Common Indian bank sender patterns
  const bankPatterns: { [key: string]: string } = {
    'HDFC': 'HDFC Bank',
    'ICICI': 'ICICI Bank',
    'SBI': 'State Bank of India',
    'AXIS': 'Axis Bank',
    'KOTAK': 'Kotak Mahindra',
    'PNB': 'Punjab National Bank',
    'BOI': 'Bank of India',
    'BOB': 'Bank of Baroda',
    'CANARA': 'Canara Bank',
    'UNION': 'Union Bank',
  };

  const senderUpper = sender.toUpperCase();
  for (const [pattern, bankName] of Object.entries(bankPatterns)) {
    if (senderUpper.includes(pattern)) {
      return bankName;
    }
  }

  // If no match, return sender as-is (truncated)
  return sender.length > 20 ? sender.substring(0, 20) : sender;
};

/**
 * Generate deterministic transaction ID for duplicate detection
 */
const generateTransactionId = (
  sender: string,
  amount: number,
  timestamp: number
): string => {
  // Simple hash function for deterministic ID
  const str = `${sender}_${amount}_${timestamp}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `tx_${Math.abs(hash).toString(36)}`;
};


