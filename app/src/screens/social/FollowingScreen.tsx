import React from 'react';
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { RootStackParamList } from '@/types';
import { usersApi } from '@/api/users';
import { UserListItem } from '@/components/profile/UserListItem';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

type RouteType = RouteProp<RootStackParamList, 'Following'>;

export function FollowingScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { username } = route.params;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['following', username],
    queryFn: ({ pageParam }) => usersApi.getFollowing(username, pageParam as string | undefined),
    getNextPageParam: (last) => last.hasMore ? last.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
  });

  const users = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserListItem user={item} onPress={() => navigation.navigate('Profile', { username: item.username })} />
          )}
          ListEmptyComponent={<EmptyState icon="users" title="Not following anyone yet" />}
          onEndReached={() => hasNextPage && fetchNextPage()}
          ListFooterComponent={isFetchingNextPage ? <LoadingSpinner size="small" /> : null}
        />
      )}
    </SafeAreaView>
  );
}
