import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { RootStackParamList } from '@/types';
import { useAuth } from '@/hooks/useAuth';

type Row = { label: string; icon: keyof typeof Feather.glyphMap; onPress: () => void; danger?: boolean };

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAuth();

  function handleLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  }

  const sections: { title: string; rows: Row[] }[] = [
    {
      title: 'Account',
      rows: [
        { label: 'Edit profile', icon: 'user', onPress: () => navigation.navigate('EditProfile') },
        { label: 'Two-factor authentication', icon: 'shield', onPress: () => navigation.navigate('TwoFactorSetup') },
      ],
    },
    {
      title: 'Privacy',
      rows: [
        { label: 'Privacy settings', icon: 'lock', onPress: () => navigation.navigate('PrivacySettings') },
        { label: 'Blocked users', icon: 'slash', onPress: () => navigation.navigate('BlockedUsers') },
      ],
    },
    {
      title: 'Support',
      rows: [
        { label: 'Help & feedback', icon: 'help-circle', onPress: () => {} },
        { label: 'About Chronicle', icon: 'info', onPress: () => {} },
      ],
    },
    {
      title: 'Danger zone',
      rows: [
        { label: 'Delete account', icon: 'trash-2', danger: true, onPress: () => {
          Alert.alert('Delete account?', 'This is permanent. Your data will be deleted after 30 days.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => {} },
          ]);
        }},
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User info */}
        <View style={styles.userCard}>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userHandle}>@{user?.username}</Text>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.rows.map((row, i) => (
                <TouchableOpacity
                  key={row.label}
                  style={[styles.row, i < section.rows.length - 1 && styles.rowBorder]}
                  onPress={row.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={row.label}
                >
                  <Feather name={row.icon} size={18} color={row.danger ? Colors.error : Colors.textSecondary} />
                  <Text style={[styles.rowLabel, row.danger && styles.rowLabelDanger]}>{row.label}</Text>
                  <Feather name="chevron-right" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign out */}
        <TouchableOpacity style={styles.signOut} onPress={handleLogout} accessibilityRole="button" accessibilityLabel="Sign out">
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  userCard: { padding: 20, paddingBottom: 12 },
  userName: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  userHandle: { color: Colors.textSecondary, fontSize: 14, marginTop: 2 },
  section: { marginBottom: 8 },
  sectionTitle: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, paddingBottom: 6 },
  sectionCard: { backgroundColor: Colors.backgroundElevated, marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLabel: { flex: 1, color: Colors.text, fontSize: 15 },
  rowLabelDanger: { color: Colors.error },
  signOut: { alignItems: 'center', padding: 24, marginTop: 8 },
  signOutText: { color: Colors.error, fontSize: 16, fontWeight: '600' },
});
