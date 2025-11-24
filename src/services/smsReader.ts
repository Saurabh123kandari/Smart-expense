import { Platform, PermissionsAndroid } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';

let listenerActive = false;
let onNewTransactionCallback: ((sender: string, body: string) => void) | null =
  null;
let lastSmsTimestamp = 0;
let pollingInterval: NodeJS.Timeout | null = null;

/**
 * Request SMS permission if not already granted
 */
const requestSmsPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_SMS
    );

    if (hasPermission) {
      return true;
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS Permission',
        message:
          'Smart Expense needs access to your SMS to automatically capture bank transaction messages.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting SMS permission:', error);
    return false;
  }
};

/**
 * Poll for new SMS messages
 * Note: For production, this should be replaced with a proper broadcast receiver
 */
const pollForNewSms = async (): Promise<void> => {
  if (!listenerActive || !onNewTransactionCallback) {
    return;
  }

  try {
    const filter = {
      box: 'inbox',
      maxCount: 10,
      sort: 'date',
    };

    SmsAndroid.list(
      JSON.stringify(filter),
      (fail: string) => {
        console.error('Error reading SMS:', fail);
      },
      (count: number, smsList: string) => {
        try {
          const messages = JSON.parse(smsList);
          const newMessages = messages.filter(
            (msg: any) => msg.date > lastSmsTimestamp
          );

          if (newMessages.length > 0) {
            // Update last timestamp
            lastSmsTimestamp = Math.max(
              ...newMessages.map((msg: any) => msg.date)
            );

            // Process each new message
            newMessages.forEach((msg: any) => {
              if (onNewTransactionCallback) {
                onNewTransactionCallback(msg.address || 'Unknown', msg.body || '');
              }
            });
          }
        } catch (error) {
          console.error('Error parsing SMS list:', error);
        }
      }
    );
  } catch (error) {
    console.error('Error polling for SMS:', error);
  }
};

/**
 * Start listening for incoming SMS messages
 * Uses polling mechanism (can be enhanced with broadcast receiver later)
 */
export const startSmsListener = async (
  onNewTx: (sender: string, body: string) => void
): Promise<void> => {
  if (Platform.OS !== 'android') {
    console.warn('SMS listener is only available on Android');
    return;
  }

  if (listenerActive) {
    console.warn('SMS listener is already active');
    return;
  }

  const hasPermission = await requestSmsPermission();
  if (!hasPermission) {
    console.error('SMS permission not granted');
    return;
  }

  onNewTransactionCallback = onNewTx;
  listenerActive = true;

  // Initialize last timestamp to current time to avoid processing old messages
  lastSmsTimestamp = Date.now();

  // Poll for new SMS every 5 seconds
  // Note: For production, implement a proper broadcast receiver
  pollingInterval = setInterval(pollForNewSms, 5000);

  console.log('SMS listener started (polling mode)');
};

/**
 * Stop listening for SMS messages
 */
export const stopSmsListener = (): void => {
  if (!listenerActive) {
    return;
  }

  listenerActive = false;
  onNewTransactionCallback = null;

  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }

  console.log('SMS listener stopped');
};

/**
 * Check if SMS listener is active
 */
export const isSmsListenerActive = (): boolean => {
  return listenerActive;
};

/**
 * Manual trigger for testing (can be called when SMS is received via broadcast)
 * This would typically be called from a native module or broadcast receiver
 */
export const handleIncomingSms = (sender: string, body: string): void => {
  if (listenerActive && onNewTransactionCallback) {
    onNewTransactionCallback(sender, body);
  }
};

