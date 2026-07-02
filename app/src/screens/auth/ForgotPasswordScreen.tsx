import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/common/Button';
import { TextInput } from '@/components/common/TextInput';
import { authApi } from '@/api/auth';

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email.includes('@')) {
      Alert.alert('Error', 'Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        {sent ? (
          <>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.body}>
              If an account exists for {email}, we've sent a password reset link.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.body}>Enter your email and we'll send you a reset link.</Text>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button label="Send reset link" onPress={handleSubmit} loading={loading} fullWidth />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 24, paddingTop: 40 },
  title: { color: Colors.text, fontSize: 24, fontWeight: '700', marginBottom: 10 },
  body: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 28 },
});
