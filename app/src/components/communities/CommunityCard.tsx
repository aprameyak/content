import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Community } from '@/types';
import { Colors } from '@/constants/colors';
import { formatNumber } from '@/utils/format';

interface CommunityCardProps {
  community: Community;
  onPress: () => void;
  onJoin?: () => void;
}

export function CommunityCard({ community, onPress, onJoin }: CommunityCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={community.name}
    >
      <View style={styles.imageWrap}>
        {community.imageUrl ? (
          <Image source={{ uri: community.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.imageFallbackText}>{community.name[0]?.toUpperCase()}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{community.name}</Text>
        {community.description && (
          <Text style={styles.description} numberOfLines={2}>{community.description}</Text>
        )}
        <View style={styles.meta}>
          <Feather name="users" size={11} color={Colors.textMuted} />
          <Text style={styles.memberCount}>{formatNumber(community.memberCount)} members</Text>
        </View>
      </View>
      {onJoin && (
        <TouchableOpacity
          style={[styles.joinBtn, community.isMember && styles.joinBtnActive]}
          onPress={onJoin}
          accessibilityRole="button"
          accessibilityLabel={community.isMember ? 'Leave community' : 'Join community'}
        >
          <Text style={[styles.joinText, community.isMember && styles.joinTextActive]}>
            {community.isMember ? 'Joined' : 'Join'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imageWrap: { width: 48, height: 48, borderRadius: 12, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  imageFallback: {
    width: '100%', height: '100%',
    backgroundColor: Colors.accentSurface,
    alignItems: 'center', justifyContent: 'center',
  },
  imageFallbackText: { color: Colors.accentLight, fontSize: 20, fontWeight: '700' },
  info: { flex: 1 },
  name: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  description: { color: Colors.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 16 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  memberCount: { color: Colors.textMuted, fontSize: 11 },
  joinBtn: {
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.accent,
  },
  joinBtnActive: { borderColor: Colors.border, backgroundColor: Colors.backgroundElevated },
  joinText: { color: Colors.accent, fontSize: 13, fontWeight: '600' },
  joinTextActive: { color: Colors.textSecondary },
});
