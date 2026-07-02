import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { Video as ExpoVideo, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { RootStackParamList } from '@/types';
import { videosApi } from '@/api/videos';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/common/Avatar';
import { ReactionBar } from '@/components/feed/ReactionBar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { reactionsApi } from '@/api/reactions';
import { formatPostDate, formatRelativeTime } from '@/utils/date';
import { API_BASE_URL } from '@/constants';
import type { ReactionType } from '@/types';

type RouteType = RouteProp<RootStackParamList, 'VideoPlayer'>;

export function VideoPlayerScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const videoRef = useRef<ExpoVideo>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);

  const { videoId } = route.params;

  const { data: video, isLoading } = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => videosApi.getVideo(videoId),
  });

  const { data: reactions, refetch: refetchReactions } = useQuery({
    queryKey: ['reactions', videoId],
    queryFn: () => reactionsApi.getReactions(videoId),
    enabled: !!video,
  });

  function handlePlaybackStatus(status: AVPlaybackStatus) {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
    setPosition(status.positionMillis / 1000);
    if (status.durationMillis) setDuration(status.durationMillis / 1000);
  }

  function togglePlay() {
    if (isPlaying) videoRef.current?.pauseAsync();
    else videoRef.current?.playAsync();
    setShowControls(true);
    setTimeout(() => setShowControls(false), 2000);
  }

  async function handleReact(type: ReactionType) {
    await reactionsApi.addReaction(videoId, type);
    refetchReactions();
  }

  async function handleRemoveReaction() {
    await reactionsApi.removeReaction(videoId);
    refetchReactions();
  }

  const isOwnVideo = video?.userId === user?.id;
  const videoUrl = video ? `${API_BASE_URL.replace('/api/v1', '')}/uploads/${video.storageKey}` : '';

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!video) return null;

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Video */}
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={togglePlay} activeOpacity={1}>
        <ExpoVideo
          ref={videoRef}
          style={StyleSheet.absoluteFill}
          source={{ uri: videoUrl }}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatus}
        />
      </TouchableOpacity>

      {/* Top overlay */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
          <Feather name="x" size={24} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.authorRow}>
          <Avatar uri={video.user.profilePictureUrl} name={video.user.name} username={video.user.username} size={32} />
          <View>
            <Text style={styles.authorName}>{video.user.name}</Text>
            <Text style={styles.authorDate}>{formatPostDate(video.postDate)}</Text>
          </View>
        </View>

        {isOwnVideo && (
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() => Alert.alert('Options', '', [
              { text: 'Archive', onPress: () => videosApi.archiveVideo(videoId) },
              { text: 'Hide', onPress: () => videosApi.hideVideo(videoId) },
              video.canDeleteAfter < new Date().toISOString()
                ? { text: 'Delete', style: 'destructive', onPress: () => videosApi.deleteVideo(videoId).then(() => navigation.goBack()) }
                : { text: 'Deletable in 24h', style: 'cancel' },
              { text: 'Cancel', style: 'cancel' },
            ])}
            accessibilityRole="button"
          >
            <Feather name="more-vertical" size={22} color={Colors.white} />
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {/* Seek bar */}
      <View style={styles.seekBar}>
        <View style={[styles.seekFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Bottom overlay */}
      <SafeAreaView style={styles.bottomOverlay} edges={['bottom']}>
        {video.description && (
          <Text style={styles.description}>{video.description}</Text>
        )}

        {reactions && (
          <ReactionBar
            counts={reactions.counts}
            userReaction={reactions.userReaction}
            onReact={handleReact}
            onRemoveReaction={handleRemoveReaction}
          />
        )}

        <TouchableOpacity
          style={styles.commentsBtn}
          onPress={() => navigation.navigate('Comments' as never, { videoId } as never)}
          accessibilityRole="button"
          accessibilityLabel="View comments"
        >
          <Feather name="message-circle" size={18} color={Colors.white} />
          <Text style={styles.commentsBtnText}>
            {video._count?.comments ?? 0} comments
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  topOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  closeBtn: { padding: 4 },
  authorRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorName: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  authorDate: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  moreBtn: { padding: 4 },
  seekBar: {
    position: 'absolute', bottom: 120, left: 0, right: 0,
    height: 3, backgroundColor: 'rgba(255,255,255,0.2)',
  },
  seekFill: { height: '100%', backgroundColor: Colors.white },
  bottomOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, gap: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  description: { color: Colors.white, fontSize: 14, lineHeight: 20 },
  commentsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentsBtnText: { color: Colors.white, fontSize: 14 },
});
