/**
 * Smart Expense App
 * Auto-capture bank transaction SMS on Android
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, useColorScheme, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDb } from './src/db/db';
import { initSmsService } from './src/services/smsService';
import { useTransactionStore } from './src/store/transactionStore';

// Screens
import Dashboard from './src/screens/Dashboard';
import Transactions from './src/screens/Transactions';
import AddExpense from './src/screens/AddExpense';
import Settings from './src/screens/Settings';
import PendingTransactions from './src/screens/PendingTransactions';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [isInitializing, setIsInitializing] = useState(true);
  const { refreshFromDb } = useTransactionStore();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database
      console.log('Initializing database...');
      await initDb();

      // Load existing transactions
      console.log('Loading transactions...');
      await refreshFromDb();

      // Initialize SMS service (Android only)
      console.log('Initializing SMS service...');
      await initSmsService();

      console.log('App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  if (isInitializing) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Stack.Navigator
          initialRouteName="Dashboard"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#f5f5f5' },
          }}
        >
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="Transactions" component={Transactions} />
          <Stack.Screen name="AddExpense" component={AddExpense} />
          <Stack.Screen name="Settings" component={Settings} />
          <Stack.Screen name="PendingTransactions" component={PendingTransactions} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default App;
