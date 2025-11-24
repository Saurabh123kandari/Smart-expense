import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useTransactionStore } from '../store/transactionStore';
import { insertTransaction } from '../db/db';
import { Transaction, TransactionType } from '../types/transaction';

interface FormValues {
  amount: string;
  type: TransactionType;
  date: string;
  description: string;
  bank: string;
}

const validationSchema = Yup.object().shape({
  amount: Yup.number()
    .required('Amount is required')
    .positive('Amount must be positive'),
  type: Yup.string()
    .oneOf(['debit', 'credit'], 'Invalid transaction type')
    .required('Transaction type is required'),
  description: Yup.string().required('Description is required'),
  bank: Yup.string(),
});

const AddExpense = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { addTransaction } = useTransactionStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues: FormValues = {
    amount: '',
    type: 'debit',
    date: new Date().toISOString().split('T')[0],
    description: '',
    bank: '',
  };

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Generate transaction ID
      const timestamp = new Date(values.date).getTime();
      const id = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create transaction object
      const transaction: Transaction = {
        id,
        amount: parseFloat(values.amount),
        type: values.type,
        date: new Date(values.date).toISOString(),
        description: values.description,
        bank: values.bank || 'Manual Entry',
        source: 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Insert to database
      await insertTransaction(transaction);

      // Add to store
      addTransaction(transaction);

      Alert.alert('Success', 'Transaction added successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Expense</Text>
        <View style={styles.placeholder} />
      </View>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          setFieldValue,
        }) => (
          <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
            {/* Amount */}
            <View style={styles.field}>
              <Text style={styles.label}>Amount *</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.amount && touched.amount && styles.inputError,
                ]}
                placeholder="Enter amount"
                placeholderTextColor="#999"
                value={values.amount}
                onChangeText={handleChange('amount')}
                onBlur={handleBlur('amount')}
                keyboardType="decimal-pad"
              />
              {errors.amount && touched.amount && (
                <Text style={styles.errorText}>{errors.amount}</Text>
              )}
            </View>

            {/* Type */}
            <View style={styles.field}>
              <Text style={styles.label}>Type *</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    values.type === 'debit' && styles.typeButtonActive,
                  ]}
                  onPress={() => setFieldValue('type', 'debit')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      values.type === 'debit' && styles.typeButtonTextActive,
                    ]}
                  >
                    Debit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    values.type === 'credit' && styles.typeButtonActive,
                  ]}
                  onPress={() => setFieldValue('type', 'credit')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      values.type === 'credit' && styles.typeButtonTextActive,
                    ]}
                  >
                    Credit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date */}
            <View style={styles.field}>
              <Text style={styles.label}>Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
                value={values.date}
                onChangeText={handleChange('date')}
                onBlur={handleBlur('date')}
              />
              {errors.date && touched.date && (
                <Text style={styles.errorText}>{errors.date}</Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  errors.description &&
                    touched.description &&
                    styles.inputError,
                ]}
                placeholder="Enter description"
                placeholderTextColor="#999"
                value={values.description}
                onChangeText={handleChange('description')}
                onBlur={handleBlur('description')}
                multiline
                numberOfLines={3}
              />
              {errors.description && touched.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            {/* Bank */}
            <View style={styles.field}>
              <Text style={styles.label}>Bank (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter bank name"
                placeholderTextColor="#999"
                value={values.bank}
                onChangeText={handleChange('bank')}
                onBlur={handleBlur('bank')}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={() => handleSubmit()}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Adding...' : 'Add Transaction'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </Formik>
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
  cancelButton: {
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
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddExpense;
