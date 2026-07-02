import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';
import { AuthStackParamList } from '@/types';
import { Button } from '@/components/common/Button';
import { TextInput } from '@/components/common/TextInput';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { usersApi } from '@/api/users';
import { TIMEZONES } from '@/constants';
import { Camera } from 'expo-camera';
import * as Notifications from 'expo-notifications';

const { width } = Dimensions.get('window');

type Step = 1 | 2 | 3 | 4 | 5 | 'register';
const TOTAL_STEPS = 5;

interface FormData {
  name: string;
  username: string;
  birthday: string;
  timezone: string;
  bio: string;
  privacyMode: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';
  email: string;
  password: string;
}

const PRIVACY_OPTIONS = [
  { value: 'PUBLIC', label: 'Public', desc: 'Anyone can see your videos' },
  { value: 'FOLLOWERS_ONLY', label: 'Followers only', desc: 'Only people you approve can see your videos' },
  { value: 'PRIVATE', label: 'Private', desc: 'Your profile and videos are completely private' },
] as const;

export function OnboardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { setTokens, setUser } = useAuthStore();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [form, setForm] = useState<FormData>({
    name: '',
    username: '',
    birthday: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    bio: '',
    privacyMode: 'PUBLIC',
    email: '',
    password: '',
  });

  function update(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validateStep(s: Step): boolean {
    const errs: Partial<FormData> = {};
    if (s === 2) {
      if (!form.name.trim()) errs.name = 'Name is required';
      if (!form.username.trim()) errs.username = 'Username is required';
      else if (!/^[a-z0-9_]+$/i.test(form.username)) errs.username = 'Only letters, numbers, underscores';
      if (!form.birthday) errs.birthday = 'Birthday is required';
    }
    if (s === 'register') {
      if (!form.email.includes('@')) errs.email = 'Valid email required';
      if (form.password.length < 8) errs.password = 'At least 8 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (step === 1) { setStep(2); return; }
    if (step === 2 && !validateStep(2)) return;
    if (step === 2) { setStep(3); return; }
    if (step === 3) { setStep(4); return; }
    if (step === 4) { setStep(5); return; }
    if (step === 5) { setStep('register'); return; }
  }

  function back() {
    if (step === 'register') { setStep(5); return; }
    if (step > 1) setStep((s) => (Number(s) - 1) as Step);
  }

  async function handleRegister() {
    if (!validateStep('register')) return;
    setLoading(true);
    try {
      const result = await authApi.register({
        username: form.username.toLowerCase(),
        email: form.email.toLowerCase(),
        password: form.password,
        name: form.name,
        birthday: form.birthday,
        timezone: form.timezone,
      });
      await setTokens(result.accessToken, result.refreshToken);
      setUser(result.user as any);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function requestCameraPermission() {
    await Camera.requestCameraPermissionsAsync();
    await Camera.requestMicrophonePermissionsAsync();
  }

  async function requestNotifPermission() {
    await Notifications.requestPermissionsAsync();
  }

  const stepNum = step === 'register' ? TOTAL_STEPS : Number(step);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Progress bar */}
        {step !== 1 && (
          <View style={styles.progressWrap}>
            {step !== 1 && (
              <TouchableOpacity onPress={back} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
                <Feather name="arrow-left" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
            <View style={styles.progressBar}>
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.progressDot, i < stepNum && styles.progressDotActive]}
                />
              ))}
            </View>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && <WelcomeStep onNext={next} onLogin={() => navigation.navigate('Login')} />}
          {step === 2 && <AboutYouStep form={form} errors={errors} update={update} onNext={next} />}
          {step === 3 && <ProfileStep form={form} update={update} onNext={next} />}
          {step === 4 && <PrivacyStep form={form} update={update} onNext={next} />}
          {step === 5 && (
            <PermissionsStep
              onCamera={requestCameraPermission}
              onNotifications={requestNotifPermission}
              onNext={next}
            />
          )}
          {step === 'register' && (
            <RegisterStep form={form} errors={errors} update={update} onRegister={handleRegister} loading={loading} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function WelcomeStep({ onNext, onLogin }: { onNext: () => void; onLogin: () => void }) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeTop}>
        <Text style={styles.wordmark}>Chronicle</Text>
        <Text style={styles.tagline}>One authentic video.{'\n'}Every day.</Text>
      </View>

      <View style={styles.welcomePoints}>
        {[
          { icon: 'video' as const, text: 'Record up to 100 seconds of your real day' },
          { icon: 'lock' as const, text: 'No editing, no filters, no retakes after posting' },
          { icon: 'calendar' as const, text: 'Build a genuine timeline of your life' },
        ].map((point) => (
          <View key={point.icon} style={styles.point}>
            <View style={styles.pointIcon}>
              <Feather name={point.icon} size={18} color={Colors.accent} />
            </View>
            <Text style={styles.pointText}>{point.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.welcomeActions}>
        <Button label="Get started" onPress={onNext} size="lg" fullWidth />
        <TouchableOpacity onPress={onLogin} style={styles.loginLink} accessibilityRole="link">
          <Text style={styles.loginText}>Already have an account? <Text style={styles.loginTextBold}>Sign in</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AboutYouStep({
  form, errors, update, onNext,
}: { form: FormData; errors: Partial<FormData>; update: (k: keyof FormData, v: string) => void; onNext: () => void }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Tell us about yourself</Text>
      <Text style={styles.stepSubtitle}>This helps people find you on Chronicle.</Text>

      <TextInput
        label="Your name"
        value={form.name}
        onChangeText={(v) => update('name', v)}
        placeholder="Alex Rivera"
        error={errors.name}
        autoCapitalize="words"
        returnKeyType="next"
      />
      <TextInput
        label="Username"
        value={form.username}
        onChangeText={(v) => update('username', v.toLowerCase())}
        placeholder="alexrivera"
        error={errors.username}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        label="Birthday"
        value={form.birthday}
        onChangeText={(v) => update('birthday', v)}
        placeholder="YYYY-MM-DD"
        error={errors.birthday}
        keyboardType="numeric"
      />

      <Button label="Continue" onPress={onNext} fullWidth style={{ marginTop: 8 }} />
    </View>
  );
}

function ProfileStep({
  form, update, onNext,
}: { form: FormData; update: (k: keyof FormData, v: string) => void; onNext: () => void }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personalize your profile</Text>
      <Text style={styles.stepSubtitle}>Optional — you can always add this later.</Text>

      <TextInput
        label="Bio"
        value={form.bio}
        onChangeText={(v) => update('bio', v)}
        placeholder="A short line about yourself..."
        maxLength={160}
        multiline
        numberOfLines={3}
      />

      <Button label="Continue" onPress={onNext} fullWidth />
      <Button label="Skip for now" onPress={onNext} variant="ghost" fullWidth style={{ marginTop: 8 }} />
    </View>
  );
}

function PrivacyStep({
  form, update, onNext,
}: { form: FormData; update: (k: keyof FormData, v: string) => void; onNext: () => void }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Who can see your videos?</Text>
      <Text style={styles.stepSubtitle}>You can change this anytime in settings.</Text>

      {PRIVACY_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.privacyOption, form.privacyMode === opt.value && styles.privacyOptionSelected]}
          onPress={() => update('privacyMode', opt.value)}
          accessibilityRole="radio"
          accessibilityState={{ checked: form.privacyMode === opt.value }}
        >
          <View style={styles.privacyRadio}>
            {form.privacyMode === opt.value && <View style={styles.privacyRadioInner} />}
          </View>
          <View style={styles.privacyText}>
            <Text style={styles.privacyLabel}>{opt.label}</Text>
            <Text style={styles.privacyDesc}>{opt.desc}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <Button label="Continue" onPress={onNext} fullWidth style={{ marginTop: 16 }} />
    </View>
  );
}

function PermissionsStep({
  onCamera, onNotifications, onNext,
}: { onCamera: () => void; onNotifications: () => void; onNext: () => void }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Allow access</Text>
      <Text style={styles.stepSubtitle}>Chronicle needs these to work.</Text>

      {[
        { icon: 'camera' as const, label: 'Camera & microphone', desc: 'Required to record your daily video', onPress: onCamera },
        { icon: 'bell' as const, label: 'Notifications', desc: 'Get reminders and stay updated on friends', onPress: onNotifications },
      ].map((perm) => (
        <TouchableOpacity
          key={perm.label}
          style={styles.permissionCard}
          onPress={perm.onPress}
          accessibilityRole="button"
          accessibilityLabel={`Allow ${perm.label}`}
        >
          <View style={styles.permIcon}>
            <Feather name={perm.icon} size={22} color={Colors.accent} />
          </View>
          <View style={styles.permText}>
            <Text style={styles.permLabel}>{perm.label}</Text>
            <Text style={styles.permDesc}>{perm.desc}</Text>
          </View>
          <Text style={styles.permAllow}>Allow</Text>
        </TouchableOpacity>
      ))}

      <Button label="Continue" onPress={onNext} fullWidth style={{ marginTop: 24 }} />
    </View>
  );
}

function RegisterStep({
  form, errors, update, onRegister, loading,
}: {
  form: FormData;
  errors: Partial<FormData>;
  update: (k: keyof FormData, v: string) => void;
  onRegister: () => void;
  loading: boolean;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Create your account</Text>
      <Text style={styles.stepSubtitle}>Your credentials are stored securely.</Text>

      <TextInput
        label="Email"
        value={form.email}
        onChangeText={(v) => update('email', v)}
        placeholder="you@example.com"
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        label="Password"
        value={form.password}
        onChangeText={(v) => update('password', v)}
        placeholder="At least 8 characters"
        error={errors.password}
        secureTextEntry
      />

      <Button label="Create account" onPress={onRegister} loading={loading} fullWidth size="lg" />

      <Text style={styles.terms}>
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, padding: 24 },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: { padding: 4 },
  progressBar: { flex: 1, flexDirection: 'row', gap: 6 },
  progressDot: {
    flex: 1, height: 3, borderRadius: 2,
    backgroundColor: Colors.backgroundElevated,
  },
  progressDotActive: { backgroundColor: Colors.accent },
  stepContainer: { flex: 1, justifyContent: 'center', gap: 0 },
  stepTitle: { color: Colors.text, fontSize: 26, fontWeight: '700', marginBottom: 8 },
  stepSubtitle: { color: Colors.textSecondary, fontSize: 15, marginBottom: 28, lineHeight: 22 },

  // Welcome
  welcomeTop: { flex: 1, justifyContent: 'center', paddingTop: 40 },
  wordmark: { color: Colors.accent, fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  tagline: { color: Colors.text, fontSize: 26, fontWeight: '600', marginTop: 12, lineHeight: 34 },
  welcomePoints: { gap: 16, marginVertical: 40 },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  pointIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.accentSurface,
    alignItems: 'center', justifyContent: 'center',
  },
  pointText: { flex: 1, color: Colors.textSecondary, fontSize: 15, lineHeight: 22, paddingTop: 6 },
  welcomeActions: { gap: 16, paddingBottom: 16 },
  loginLink: { alignItems: 'center' },
  loginText: { color: Colors.textSecondary, fontSize: 14 },
  loginTextBold: { color: Colors.accent, fontWeight: '600' },

  // Privacy
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  privacyOptionSelected: { borderColor: Colors.accent, backgroundColor: Colors.accentSurface },
  privacyRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  privacyRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  privacyText: { flex: 1 },
  privacyLabel: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  privacyDesc: { color: Colors.textSecondary, fontSize: 13, marginTop: 2, lineHeight: 18 },

  // Permissions
  permissionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    marginBottom: 10, backgroundColor: Colors.backgroundElevated,
  },
  permIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.accentSurface, alignItems: 'center', justifyContent: 'center',
  },
  permText: { flex: 1 },
  permLabel: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  permDesc: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  permAllow: { color: Colors.accent, fontSize: 14, fontWeight: '600' },

  terms: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});
