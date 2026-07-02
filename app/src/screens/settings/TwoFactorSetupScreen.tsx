import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/common/Button';
import { TextInput } from '@/components/common/TextInput';
import { authApi } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';

export function TwoFactorSetupScreen() {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const [code, setCode] = useState('');
  const [secret, setSecret] = useState('');
  const [step, setStep] = useState<'idle' | 'setup' | 'done'>('idle');

  const setupMutation = useMutation({
    mutationFn: authApi.setup2FA,
    onSuccess: (data) => {
      setSecret(data.secret);
      setStep('setup');
    },
    onError: () => Alert.alert('Error', 'Failed to set up 2FA.'),
  });

  const verifyMutation = useMutation({
    mutationFn: () => authApi.verify2FA(code),
    onSuccess: async () => {
      await refreshUser();
      setStep('done');
    },
    onError: () => Alert.alert('Invalid code', 'Enter the 6-digit code from your authenticator app.'),
  });

  const disableMutation = useMutation({
    mutationFn: () => authApi.disable2FA(code),
    onSuccess: async () => {
      await refreshUser();
      navigation.goBack();
    },
    onError: () => Alert.alert('Error', 'Invalid code.'),
  });

  if (user?.twoFactorEnabled) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.enabledBadge}>
            <Feather name="shield" size={32} color={Colors.success} />
            <Text style={styles.enabledText}>Two-factor auth is enabled</Text>
          </View>
          <Text style={styles.subtitle}>Enter your authenticator code to disable it.</Text>
          <TextInput
            label="Authenticator code"
            value={code}
            onChangeText={setCode}
            placeholder="000000"
            keyboardType="numeric"
            maxLength={6}
          />
          <Button label="Disable 2FA" onPress={() => disableMutation.mutate()} loading={disableMutation.isPending} variant="danger" fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'done') {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={styles.content}>
          <Feather name="check-circle" size={56} color={Colors.success} />
          <Text style={styles.successTitle}>2FA enabled</Text>
          <Text style={styles.subtitle}>Your account is now protected with two-factor authentication.</Text>
          <Button label="Done" onPress={() => navigation.goBack()} fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {step === 'idle' && (
          <>
            <Feather name="shield" size={48} color={Colors.accent} />
            <Text style={styles.title}>Protect your account</Text>
            <Text style={styles.subtitle}>
              Two-factor authentication adds an extra layer of security. You'll need your authenticator app each time you sign in.
            </Text>
            <Button label="Set up 2FA" onPress={() => setupMutation.mutate()} loading={setupMutation.isPending} fullWidth size="lg" />
          </>
        )}

        {step === 'setup' && (
          <>
            <Text style={styles.title}>Scan the QR code</Text>
            <Text style={styles.subtitle}>
              Open your authenticator app (Google Authenticator, Authy, etc.) and scan the QR code, or enter the secret key manually.
            </Text>
            <View style={styles.secretBox}>
              <Text style={styles.secretKey}>{secret}</Text>
              <Text style={styles.secretHint}>Enter this key in your authenticator app</Text>
            </View>
            <TextInput
              label="Verification code"
              value={code}
              onChangeText={setCode}
              placeholder="Enter the 6-digit code"
              keyboardType="numeric"
              maxLength={6}
            />
            <Button label="Verify and enable" onPress={() => verifyMutation.mutate()} loading={verifyMutation.isPending} fullWidth />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, alignItems: 'center', gap: 16 },
  title: { color: Colors.text, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  secretBox: {
    backgroundColor: Colors.backgroundElevated, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.border, width: '100%', alignItems: 'center',
  },
  secretKey: { color: Colors.accent, fontSize: 16, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 6 },
  secretHint: { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },
  enabledBadge: { alignItems: 'center', gap: 8, marginBottom: 8 },
  enabledText: { color: Colors.success, fontSize: 17, fontWeight: '600' },
  successTitle: { color: Colors.text, fontSize: 24, fontWeight: '700' },
});
