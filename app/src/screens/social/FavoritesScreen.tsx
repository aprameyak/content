import React from 'react';
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { RootStackParamList } from '@/types';
import { usersApi } from '@/api/users';
import { UserListItem } from '@/components/profile/UserListItem';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

export function FavoritesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: usersApi.getFavorites,
  });

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
          ListEmptyComponent={<EmptyState icon="star" title="No favorites yet" message="Add favorites to see their posts first in your feed." />}
        />
      )}
    </SafeAreaView>
  );
}
