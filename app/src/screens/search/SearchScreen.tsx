import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { RootStackParamList } from '@/types';
import { searchApi } from '@/api/search';
import { UserListItem } from '@/components/profile/UserListItem';
import { CommunityCard } from '@/components/communities/CommunityCard';
import { EmptyState } from '@/components/common/EmptyState';

type Tab = 'people' | 'communities';

export function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('people');

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['search-users', query],
    queryFn: () => searchApi.searchUsers(query),
    enabled: query.length > 0 && tab === 'people',
  });

  const { data: communities, isLoading: loadingCommunities } = useQuery({
    queryKey: ['search-communities', query],
    queryFn: () => searchApi.searchCommunities(query),
    enabled: query.length > 0 && tab === 'communities',
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Feather name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search people, communities..."
          placeholderTextColor={Colors.textMuted}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Cancel">
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['people', 'communities'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!query ? (
        <EmptyState icon="search" title="Search Chronicle" message="Find people and communities to follow." />
      ) : tab === 'people' ? (
        <FlatList
          data={users ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserListItem
              user={item}
              onPress={() => navigation.navigate('Profile', { username: item.username })}
            />
          )}
          ListEmptyComponent={
            !loadingUsers ? <EmptyState icon="users" title="No people found" message={`No results for "${query}"`} /> : null
          }
        />
      ) : (
        <FlatList
          data={communities ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CommunityCard
              community={item}
              onPress={() => navigation.navigate('CommunityDetail', { slug: item.slug })}
            />
          )}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            !loadingCommunities ? <EmptyState icon="grid" title="No communities found" message={`No results for "${query}"`} /> : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  input: {
    flex: 1, color: Colors.text, fontSize: 16,
    paddingVertical: 6,
  },
  cancelText: { color: Colors.accent, fontSize: 15 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent },
  tabText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: Colors.accent, fontWeight: '600' },
});
