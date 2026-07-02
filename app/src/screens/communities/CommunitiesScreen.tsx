import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { RootStackParamList } from '@/types';
import { communitiesApi } from '@/api/communities';
import { CommunityCard } from '@/components/communities/CommunityCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

export function CommunitiesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();

  const { data: communities, isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: communitiesApi.getCommunities,
  });

  const joinMutation = useMutation({
    mutationFn: (slug: string) => communitiesApi.joinCommunity(slug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communities'] }),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Communities</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search')} accessibilityRole="button" accessibilityLabel="Search">
          <Feather name="search" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={communities ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CommunityCard
              community={item}
              onPress={() => navigation.navigate('CommunityDetail', { slug: item.slug })}
              onJoin={() => {
                if (item.isMember) {
                  communitiesApi.leaveCommunity(item.slug).then(() =>
                    queryClient.invalidateQueries({ queryKey: ['communities'] }),
                  );
                } else {
                  joinMutation.mutate(item.slug);
                }
              }}
            />
          )}
          ListEmptyComponent={
            <EmptyState icon="grid" title="No communities yet" message="Communities will appear here." />
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { color: Colors.text, fontSize: 22, fontWeight: '700' },
  list: { padding: 16 },
});
