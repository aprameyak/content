import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { User } from '@/types';
import { Colors } from '@/constants/colors';
import { Avatar } from '@/components/common/Avatar';

interface UserListItemProps {
  user: User;
  onPress?: () => void;
  onFollowPress?: () => void;
  showFollowButton?: boolean;
}

export function UserListItem({ user, onPress, onFollowPress, showFollowButton = false }: UserListItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${user.name} @${user.username}`}
    >
      <Avatar uri={user.profilePictureUrl} name={user.name} username={user.username} size={44} onPress={onPress} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{user.name}</Text>
          {user.isVerified && <Feather name="check-circle" size={13} color={Colors.accent} />}
        </View>
        <Text style={styles.username}>@{user.username}</Text>
      </View>
      {showFollowButton && onFollowPress && (
        <TouchableOpacity
          style={[styles.followBtn, user.isFollowing && styles.followBtnActive]}
          onPress={onFollowPress}
          accessibilityRole="button"
          accessibilityLabel={user.isFollowing ? 'Unfollow' : 'Follow'}
        >
          <Text style={[styles.followText, user.isFollowing && styles.followTextActive]}>
            {user.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  username: { color: Colors.textSecondary, fontSize: 13, marginTop: 1 },
  followBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  followBtnActive: {
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundElevated,
  },
  followText: { color: Colors.accent, fontSize: 13, fontWeight: '600' },
  followTextActive: { color: Colors.textSecondary },
});
