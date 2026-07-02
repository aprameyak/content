import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from './Button';
import { Colors } from '@/constants/colors';

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && (
        <Feather name={icon} size={40} color={Colors.textMuted} style={styles.icon} />
      )}
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  icon: { marginBottom: 16 },
  title: { color: Colors.text, fontSize: 17, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  message: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  action: { marginTop: 20 },
});
