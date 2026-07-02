import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Video, ReactionType, RootStackParamList } from '@/types';
import { Colors } from '@/constants/colors';
import { Avatar } from '@/components/common/Avatar';
import { ReactionBar } from './ReactionBar';
import { formatRelativeTime, formatPostDate } from '@/utils/date';
import { formatDuration, truncateText } from '@/utils/format';
import { reactionsApi } from '@/api/reactions';

interface VideoCardProps {
  video: Video;
  onPress?: () => void;
}

export function VideoCard({ video, onPress }: VideoCardProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [reactionCounts, setReactionCounts] = useState(
    video.reactionCounts ?? { HEART: 0, CLAP: 0, FIRE: 0, SMILE: 0, CRY: 0, MUSCLE: 0, total: 0 },
  );
  const [userReaction, setUserReaction] = useState<ReactionType | null>(
    video.userReaction ?? null,
  );

  function handlePress() {
    if (onPress) { onPress(); return; }
    navigation.navigate('VideoPlayer', { videoId: video.id, postDate: video.postDate });
  }

  function handleAuthorPress() {
    navigation.navigate('Profile', { username: video.user.username });
  }

  function handleCommentsPress() {
    navigation.navigate('Comments', { videoId: video.id });
  }

  async function handleReact(type: ReactionType) {
    const prev = userReaction;
    // Optimistic update
    const newCounts = { ...reactionCounts };
    if (prev) newCounts[prev] = Math.max(0, (newCounts[prev] ?? 0) - 1);
    newCounts[type] = (newCounts[type] ?? 0) + 1;
    newCounts.total = Object.values(newCounts).slice(0, 6).reduce((a, b) => a + b, 0);
    setReactionCounts(newCounts);
    setUserReaction(type);

    try {
      await reactionsApi.addReaction(video.id, type);
    } catch {
      setReactionCounts(reactionCounts);
      setUserReaction(prev);
    }
  }

  async function handleRemoveReaction() {
    const prev = userReaction;
    if (!prev) return;
    const newCounts = { ...reactionCounts };
    newCounts[prev] = Math.max(0, (newCounts[prev] ?? 0) - 1);
    newCounts.total = Math.max(0, newCounts.total - 1);
    setReactionCounts(newCounts);
    setUserReaction(null);

    try {
      await reactionsApi.removeReaction(video.id);
    } catch {
      setReactionCounts(reactionCounts);
      setUserReaction(prev);
    }
  }

  const commentCount = video._count?.comments ?? 0;

  return (
    <View style={styles.card}>
      {/* Author row */}
      <TouchableOpacity
        style={styles.authorRow}
        onPress={handleAuthorPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`View ${video.user.name}'s profile`}
      >
        <Avatar uri={video.user.profilePictureUrl} name={video.user.name} username={video.user.username} size={36} />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{video.user.name}</Text>
          <Text style={styles.authorMeta}>@{video.user.username} · {formatPostDate(video.postDate)}</Text>
        </View>
        <Text style={styles.duration}>{formatDuration(video.duration)}</Text>
      </TouchableOpacity>

      {/* Thumbnail */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="Play video"
      >
        <View style={styles.thumbnail}>
          {video.thumbnailKey ? (
            <ImageBackground
              source={{ uri: video.thumbnailUrl ?? '' }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            >
              <View style={styles.playOverlay}>
                <Feather name="play" size={32} color={Colors.white} />
              </View>
            </ImageBackground>
          ) : (
            <View style={[styles.thumbnailImage, styles.thumbnailFallback]}>
              <Feather name="video" size={40} color={Colors.textMuted} />
              <View style={styles.playOverlay}>
                <Feather name="play" size={32} color={Colors.white} />
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Metadata */}
      {(video.mood || video.location || video.weather) && (
        <View style={styles.metaRow}>
          {video.mood && <Text style={styles.metaBadge}>{video.mood}</Text>}
          {video.location && (
            <View style={styles.metaItem}>
              <Feather name="map-pin" size={11} color={Colors.textMuted} />
              <Text style={styles.metaText}>{video.location}</Text>
            </View>
          )}
          {video.weather && (
            <Text style={styles.metaText}>{video.weather}</Text>
          )}
        </View>
      )}

      {/* Description */}
      {video.description && (
        <Text style={styles.description} numberOfLines={2}>
          {truncateText(video.description, 120)}
        </Text>
      )}

      {/* Reactions & comments */}
      <View style={styles.footer}>
        <ReactionBar
          counts={reactionCounts}
          userReaction={userReaction}
          onReact={handleReact}
          onRemoveReaction={handleRemoveReaction}
        />
        <TouchableOpacity
          style={styles.commentsBtn}
          onPress={handleCommentsPress}
          accessibilityRole="button"
          accessibilityLabel={`${commentCount} comments`}
        >
          <Feather name="message-circle" size={16} color={Colors.textSecondary} />
          {commentCount > 0 && <Text style={styles.commentCount}>{commentCount}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  authorInfo: { flex: 1 },
  authorName: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  authorMeta: { color: Colors.textMuted, fontSize: 12, marginTop: 1 },
  duration: { color: Colors.textMuted, fontSize: 12 },
  thumbnail: { width: '100%', aspectRatio: 9 / 16, backgroundColor: Colors.backgroundElevated },
  thumbnailImage: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  thumbnailFallback: { alignItems: 'center', justifyContent: 'center' },
  playOverlay: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 12, paddingTop: 10 },
  metaBadge: {
    color: Colors.accentLight,
    fontSize: 11,
    fontWeight: '500',
    backgroundColor: Colors.accentSurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  metaItem: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  metaText: { color: Colors.textMuted, fontSize: 11 },
  description: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, paddingHorizontal: 12, paddingTop: 8 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingTop: 10,
  },
  commentsBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  commentCount: { color: Colors.textSecondary, fontSize: 12 },
});
