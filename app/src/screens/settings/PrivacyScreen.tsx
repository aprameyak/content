import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { RootStackParamList, PrivacyMode } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { usersApi } from '@/api/users';

const OPTIONS: { value: PrivacyMode; label: string; desc: string }[] = [
  { value: 'PUBLIC', label: 'Public', desc: 'Anyone can follow you and see your videos' },
  { value: 'FOLLOWERS_ONLY', label: 'Followers only', desc: 'Only approved followers can see your videos' },
  { value: 'PRIVATE', label: 'Private', desc: 'Your profile is completely private' },
  { value: 'CLOSE_FRIENDS_ONLY', label: 'Close friends only', desc: 'Only your close friends list can see your videos' },
];

export function PrivacySettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, refreshUser } = useAuth();
  const [selected, setSelected] = useState<PrivacyMode>(user?.privacyMode ?? 'PUBLIC');

  const updateMutation = useMutation({
    mutationFn: (mode: PrivacyMode) => usersApi.updateMe({ privacyMode: mode }),
    onSuccess: async () => {
      await refreshUser();
      navigation.goBack();
    },
    onError: () => Alert.alert('Error', 'Failed to update privacy settings.'),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.subtitle}>Choose who can see your profile and videos.</Text>

        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.option, selected === opt.value && styles.optionSelected]}
            onPress={() => setSelected(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === opt.value }}
          >
            <View style={[styles.radio, selected === opt.value && styles.radioSelected]}>
              {selected === opt.value && <View style={styles.radioInner} />}
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>{opt.label}</Text>
              <Text style={styles.optionDesc}>{opt.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.saveBtn, updateMutation.isPending && { opacity: 0.5 }]}
          onPress={() => updateMutation.mutate(selected)}
          disabled={updateMutation.isPending}
          accessibilityRole="button"
        >
          <Text style={styles.saveBtnText}>Save changes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.blockedBtn} onPress={() => navigation.navigate('BlockedUsers')} accessibilityRole="button">
          <Text style={styles.blockedBtnText}>Manage blocked users</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  subtitle: { color: Colors.textSecondary, fontSize: 14, marginBottom: 20, lineHeight: 20 },
  option: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  optionSelected: { borderColor: Colors.accent, backgroundColor: Colors.accentSurface },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  radioSelected: {},
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  optionText: { flex: 1 },
  optionLabel: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  optionDesc: { color: Colors.textSecondary, fontSize: 13, marginTop: 2, lineHeight: 18 },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  blockedBtn: { alignItems: 'center', paddingTop: 16 },
  blockedBtnText: { color: Colors.textSecondary, fontSize: 14 },
});
