import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { RootStackParamList, Video } from '@/types';
import { communitiesApi } from '@/api/communities';
import { VideoCard } from '@/components/feed/VideoCard';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { formatNumber } from '@/utils/format';

type RouteType = RouteProp<RootStackParamList, 'CommunityDetail'>;

export function CommunityDetailScreen() {
  const route = useRoute<RouteType>();
  const queryClient = useQueryClient();
  const { slug } = route.params;

  const { data: community, isLoading: loadingCommunity } = useQuery({
    queryKey: ['community', slug],
    queryFn: () => communitiesApi.getCommunity(slug),
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['community-feed', slug],
    queryFn: ({ pageParam }) => communitiesApi.getCommunityFeed(slug, pageParam as string | undefined),
    getNextPageParam: (last) => last.hasMore ? last.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
  });

  const joinMutation = useMutation({
    mutationFn: () =>
      community?.isMember ? communitiesApi.leaveCommunity(slug) : communitiesApi.joinCommunity(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', slug] });
    },
  });

  const videos = data?.pages.flatMap((p) => p.items) ?? [];

  if (loadingCommunity) return <LoadingSpinner fullScreen />;
  if (!community) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <FlatList
        data={videos as Video[]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VideoCard video={item} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.communityIcon}>
              <Text style={styles.communityIconText}>{community.name[0]?.toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{community.name}</Text>
            {community.description && <Text style={styles.description}>{community.description}</Text>}
            <Text style={styles.memberCount}>{formatNumber(community.memberCount)} members</Text>
            <Button
              label={community.isMember ? 'Leave' : 'Join community'}
              onPress={() => joinMutation.mutate()}
              loading={joinMutation.isPending}
              variant={community.isMember ? 'secondary' : 'primary'}
              style={styles.joinBtn}
            />
          </View>
        }
        ListEmptyComponent={
          !isLoading ? <EmptyState icon="video" title="No posts yet" message="Be the first to share in this community." /> : null
        }
        onEndReached={() => hasNextPage && fetchNextPage()}
        ListFooterComponent={isFetchingNextPage ? <LoadingSpinner size="small" /> : null}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  header: { alignItems: 'center', paddingVertical: 24 },
  communityIcon: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: Colors.accentSurface, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  communityIconText: { color: Colors.accentLight, fontSize: 32, fontWeight: '700' },
  name: { color: Colors.text, fontSize: 24, fontWeight: '700', marginBottom: 6 },
  description: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  memberCount: { color: Colors.textMuted, fontSize: 13, marginBottom: 16 },
  joinBtn: { minWidth: 160 },
});
