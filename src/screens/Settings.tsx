import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getAutoConfirmSetting,
  setAutoConfirmSetting,
  getPendingTransactions,
} from '../services/smsService';

const Settings = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const autoConfirmValue = await getAutoConfirmSetting();
      setAutoConfirm(autoConfirmValue);

      const pending = await getPendingTransactions();
      setPendingCount(pending.length);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoConfirmToggle = async (value: boolean) => {
    try {
      await setAutoConfirmSetting(value);
      setAutoConfirm(value);
    } catch (error) {
      console.error('Error updating auto-confirm setting:', error);
    }
  };

  // Refresh pending count when screen comes into focus
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSettings();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Auto-Confirm Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SMS Transactions</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Auto-confirm SMS transactions</Text>
              <Text style={styles.settingDescription}>
                When enabled, parsed SMS transactions are automatically added to your
                expenses. When disabled, transactions will be added to a review queue.
              </Text>
            </View>
            <Switch
              value={autoConfirm}
              onValueChange={handleAutoConfirmToggle}
              trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Pending Transactions Section */}
        {!autoConfirm && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.pendingButton}
              onPress={() => navigation.navigate('PendingTransactions' as never)}
            >
              <View style={styles.pendingButtonLeft}>
                <Text style={styles.pendingButtonTitle}>Pending Transactions</Text>
                <Text style={styles.pendingButtonDescription}>
                  Review and confirm SMS transactions
                </Text>
              </View>
              <View style={styles.pendingButtonRight}>
                {pendingCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingCount}</Text>
                  </View>
                )}
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0 (MVP)</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>Android</Text>
          </View>
        </View>
      </ScrollView>
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
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  pendingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pendingButtonLeft: {
    flex: 1,
    marginRight: 16,
  },
  pendingButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  pendingButtonDescription: {
    fontSize: 14,
    color: '#666',
  },
  pendingButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 24,
    color: '#999',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});

export default Settings;
