import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { usersApi } from '@/api/users';
import { UserListItem } from '@/components/profile/UserListItem';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';

export function BlockedUsersScreen() {
  const queryClient = useQueryClient();
  const { data: blocked, isLoading } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: usersApi.getBlockedUsers,
  });

  const unblockMutation = useMutation({
    mutationFn: (username: string) => usersApi.unblockUser(username),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blocked-users'] }),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={blocked ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <UserListItem user={item} />
              <Button
                label="Unblock"
                onPress={() => unblockMutation.mutate(item.username)}
                variant="secondary"
                size="sm"
                style={styles.unblockBtn}
              />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon="slash" title="No blocked users" message="Users you block will appear here." />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  row: { flexDirection: 'row', alignItems: 'center', paddingRight: 16 },
  unblockBtn: { marginLeft: 'auto' },
});
