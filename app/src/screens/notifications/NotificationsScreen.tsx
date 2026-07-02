import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Notification } from '@/types';
import { notificationsApi } from '@/api/notifications';
import { useNotificationStore } from '@/store/notificationStore';
import { Avatar } from '@/components/common/Avatar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { formatRelativeTime } from '@/utils/date';

const NOTIF_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  NEW_FOLLOWER: 'user-plus',
  FOLLOW_REQUEST: 'user-plus',
  FOLLOW_ACCEPTED: 'user-check',
  FRIEND_POSTED: 'video',
  COMMENT: 'message-circle',
  REPLY: 'corner-down-right',
  REACTION: 'heart',
  STREAK_REMINDER: 'zap',
  DAILY_REMINDER: 'sun',
  STREAK_MILESTONE: 'award',
  SYSTEM: 'bell',
};

export function NotificationsScreen() {
  const queryClient = useQueryClient();
  const clearUnread = useNotificationStore((s) => s.clearUnread);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) => notificationsApi.getNotifications(pageParam as string | undefined),
    getNextPageParam: (last) => last.hasMore ? last.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      clearUnread();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.pages.flatMap((p) => p.items) ?? [];

  function renderItem({ item }: { item: Notification }) {
    const icon = NOTIF_ICONS[item.type] ?? 'bell';
    return (
      <View style={[styles.item, !item.isRead && styles.itemUnread]}>
        {item.sender ? (
          <Avatar uri={item.sender.profilePictureUrl} name={item.sender.name} username={item.sender.username} size={40} />
        ) : (
          <View style={styles.iconCircle}>
            <Feather name={icon} size={18} color={Colors.accent} />
          </View>
        )}
        <View style={styles.itemText}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemBody}>{item.body}</Text>
          <Text style={styles.itemTime}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={() => markAllMutation.mutate()} accessibilityRole="button" accessibilityLabel="Mark all read">
          <Text style={styles.markAll}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState icon="bell" title="All quiet" message="We'll let you know when something happens." />
          }
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage ? <LoadingSpinner size="small" /> : null}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  markAll: { color: Colors.accent, fontSize: 14 },
  list: { paddingBottom: 24 },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 68 },
  item: { flexDirection: 'row', gap: 12, padding: 16, alignItems: 'flex-start' },
  itemUnread: { backgroundColor: 'rgba(124,58,237,0.05)' },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.accentSurface, alignItems: 'center', justifyContent: 'center',
  },
  itemText: { flex: 1 },
  itemTitle: { color: Colors.text, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  itemBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  itemTime: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent, marginTop: 4 },
});
