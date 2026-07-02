import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { RootStackParamList, Video } from '@/types';
import { feedApi } from '@/api/feed';
import { VideoCard } from '@/components/feed/VideoCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useNotificationStore } from '@/store/notificationStore';
import { useDaily } from '@/hooks/useDaily';
import { useCountdown } from '@/hooks/useCountdown';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { truncateText } from '@/utils/format';

type Sort = 'chronological' | 'close-friends-first';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [sort, setSort] = useState<Sort>('chronological');
  useNotifications();

  const { data: dailyStatus, refetch: refetchDaily } = useDaily();

  const countdown = useCountdown(dailyStatus?.nextPostAvailableAt);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isError,
  } = useInfiniteQuery({
    queryKey: ['feed', sort],
    queryFn: ({ pageParam }) => feedApi.getFeed(pageParam as string | undefined, sort),
    getNextPageParam: (last) => last.hasMore ? last.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
  });

  const videos = data?.pages.flatMap((p) => p.items) ?? [];

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetch(), refetchDaily()]);
  }, [refetch, refetchDaily]);

  function renderItem({ item }: { item: Video }) {
    return <VideoCard video={item} />;
  }

  function renderHeader() {
    return (
      <View>
        {/* Today's status */}
        {dailyStatus && (
          <View style={styles.todayCard}>
            {dailyStatus.hasPosted ? (
              <View style={styles.todayPosted}>
                <Feather name="check-circle" size={16} color={Colors.success} />
                <Text style={styles.todayPostedText}>Today's memory captured</Text>
                {dailyStatus.nextPostAvailableAt && !countdown.isExpired && (
                  <Text style={styles.countdown}>Next in {countdown.formatted}</Text>
                )}
              </View>
            ) : (
              <View style={styles.todayNotPosted}>
                <Text style={styles.todayPrompt}>What did today look like?</Text>
                <TouchableOpacity
                  style={styles.recordNowBtn}
                  onPress={() => navigation.navigate('Main')}
                  accessibilityRole="button"
                >
                  <Text style={styles.recordNowText}>Record now</Text>
                  <Feather name="arrow-right" size={14} color={Colors.accent} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Sort toggle */}
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>From people you follow</Text>
          <TouchableOpacity
            onPress={() => setSort(sort === 'chronological' ? 'close-friends-first' : 'chronological')}
            style={styles.sortBtn}
            accessibilityRole="button"
            accessibilityLabel={`Sort: ${sort === 'chronological' ? 'Chronological' : 'Close friends first'}`}
          >
            <Feather name="sliders" size={14} color={Colors.textSecondary} />
            <Text style={styles.sortText}>
              {sort === 'chronological' ? 'Recent' : 'Close friends'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.wordmark}>Chronicle</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={styles.notifBtn}
          accessibilityRole="button"
          accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Feather name="bell" size={22} color={Colors.text} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingSpinner message="Loading your feed..." />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <EmptyState
              icon="video"
              title="No posts yet"
              message="When people you follow post their daily memory, they'll appear here."
            />
          }
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage ? <LoadingSpinner size="small" /> : null}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              tintColor={Colors.accent}
            />
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  wordmark: { color: Colors.accent, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  notifBtn: { padding: 4 },
  badge: {
    position: 'absolute', top: 0, right: 0,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },

  todayCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  todayPosted: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  todayPostedText: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  countdown: { color: Colors.textMuted, fontSize: 12, marginLeft: 4 },
  todayNotPosted: {},
  todayPrompt: { color: Colors.text, fontSize: 16, fontWeight: '600', marginBottom: 8 },
  recordNowBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recordNowText: { color: Colors.accent, fontSize: 14, fontWeight: '600' },

  feedHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  feedTitle: { color: Colors.textMuted, fontSize: 13, fontWeight: '500' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sortText: { color: Colors.textSecondary, fontSize: 12 },
});
