import { useState, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

export interface UseRequestSmsPermissionReturn {
  granted: boolean;
  loading: boolean;
  request: () => Promise<boolean>;
}

export const useRequestSmsPermission = (): UseRequestSmsPermissionReturn => {
  const [granted, setGranted] = useState(false);
  const [loading, setLoading] = useState(false);

  const request = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return false;
    }

    setLoading(true);
    try {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_SMS
      );

      if (hasPermission) {
        setGranted(true);
        setLoading(false);
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

      const isGranted = result === PermissionsAndroid.RESULTS.GRANTED;
      setGranted(isGranted);

      if (!isGranted && result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'Permission Denied',
          'SMS permission is required for auto-capture. You can enable it in app settings.',
          [{ text: 'OK' }]
        );
      }

      setLoading(false);
      return isGranted;
    } catch (err) {
      console.error('Error requesting SMS permission:', err);
      setLoading(false);
      return false;
    }
  }, []);

  return { granted, loading, request };
};


