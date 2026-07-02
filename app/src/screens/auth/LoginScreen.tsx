import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '@/constants/colors';
import { AuthStackParamList } from '@/types';
import { Button } from '@/components/common/Button';
import { TextInput } from '@/components/common/TextInput';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { setTokens, setUser } = useAuthStore();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  async function handleLogin() {
    if (!emailOrUsername.trim() || !password) {
      Alert.alert('Error', 'Please enter your email/username and password.');
      return;
    }
    setLoading(true);
    try {
      const result = await authApi.login({ emailOrUsername: emailOrUsername.trim(), password });
      if ('requires2FA' in result && result.requires2FA) {
        setTempToken(result.tempToken);
        setShowTwoFactor(true);
      } else {
        await setTokens((result as any).accessToken, (result as any).refreshToken);
        setUser((result as any).user);
      }
    } catch (e: any) {
      Alert.alert('Sign in failed', e?.response?.data?.error?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  async function handleTwoFactor() {
    if (twoFactorCode.length !== 6) {
      Alert.alert('Error', 'Enter the 6-digit code from your authenticator app.');
      return;
    }
    setLoading(true);
    try {
      const result = await authApi.login2FA(tempToken, twoFactorCode);
      await setTokens(result.accessToken, result.refreshToken);
      setUser(result.user as any);
    } catch {
      Alert.alert('Error', 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (showTwoFactor) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={() => setShowTwoFactor(false)} style={styles.backBtn}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Two-factor auth</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code from your authenticator app.</Text>
          <TextInput
            label="Code"
            value={twoFactorCode}
            onChangeText={setTwoFactorCode}
            placeholder="000000"
            keyboardType="numeric"
            maxLength={6}
          />
          <Button label="Verify" onPress={handleTwoFactor} loading={loading} fullWidth size="lg" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.wordmark}>Chronicle</Text>
          <Text style={styles.title}>Welcome back</Text>

          <TextInput
            label="Email or username"
            value={emailOrUsername}
            onChangeText={setEmailOrUsername}
            placeholder="you@example.com or @username"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotLink}
            accessibilityRole="link"
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button label="Sign in" onPress={handleLogin} loading={loading} fullWidth size="lg" style={{ marginTop: 8 }} />

          <TouchableOpacity
            onPress={() => navigation.navigate('Onboarding')}
            style={styles.registerLink}
            accessibilityRole="link"
          >
            <Text style={styles.registerText}>
              New to Chronicle? <Text style={styles.registerTextBold}>Create account</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 0 },
  wordmark: { color: Colors.accent, fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  title: { color: Colors.text, fontSize: 26, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: Colors.textSecondary, fontSize: 15, marginBottom: 24, lineHeight: 22 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 8, marginTop: -8 },
  forgotText: { color: Colors.accent, fontSize: 14 },
  registerLink: { alignItems: 'center', marginTop: 24 },
  registerText: { color: Colors.textSecondary, fontSize: 14 },
  registerTextBold: { color: Colors.accent, fontWeight: '600' },
  backBtn: { marginBottom: 24 },
  backText: { color: Colors.accent, fontSize: 15 },
});
