import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';

interface AvatarProps {
  uri?: string | null;
  username?: string;
  name?: string;
  size?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

function getInitials(name?: string, username?: string): string {
  const source = name || username || '?';
  const parts = source.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function getAvatarColor(username?: string): string {
  const colors = [
    '#5B21B6', '#7C3AED', '#4C1D95', '#6D28D9',
    '#2563EB', '#1D4ED8', '#0369A1', '#065F46',
  ];
  const idx = (username?.charCodeAt(0) ?? 0) % colors.length;
  return colors[idx];
}

export function Avatar({ uri, username, name, size = 40, onPress, style }: AvatarProps) {
  const initials = getInitials(name, username);
  const bgColor = getAvatarColor(username);
  const fontSize = size * 0.38;

  const content = (
    <View
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}
      accessibilityLabel={name || username || 'User avatar'}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} accessibilityRole="button">
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: Colors.white, fontWeight: '700', letterSpacing: 0.5 },
});
