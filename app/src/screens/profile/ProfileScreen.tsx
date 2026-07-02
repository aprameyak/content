import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { RootStackParamList } from '@/types';
import { usersApi } from '@/api/users';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/common/Avatar';
import { CalendarView } from '@/components/profile/CalendarView';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/common/Button';
import { VideoCard } from '@/components/feed/VideoCard';
import { formatMonthYear } from '@/utils/date';
import { formatNumber } from '@/utils/format';

type RouteType = RouteProp<RootStackParamList, 'Profile'>;

const today = new Date();

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteType>();
  const { user: me } = useAuth();
  const queryClient = useQueryClient();

  const username = route.params?.username ?? me?.username ?? '';
  const isOwnProfile = username === me?.username;

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => usersApi.getUserProfile(username),
    enabled: !!username,
  });

  const { data: calendar } = useQuery({
    queryKey: ['calendar', username],
    queryFn: () => usersApi.getUserCalendar(username),
    enabled: !!username && viewMode === 'calendar',
  });

  const { data: videos } = useQuery({
    queryKey: ['user-videos', username],
    queryFn: () => usersApi.getUserVideos(username),
    enabled: !!username && viewMode === 'list',
  });

  const followMutation = useMutation({
    mutationFn: () =>
      profile?.isFollowing ? usersApi.unfollow(username) : usersApi.follow(username),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', username] }),
  });

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!profile) return null;

  function handleDayPress(date: string) {
    const day = calendar?.[date];
    if (day?.videoId) {
      navigation.navigate('VideoPlayer', { videoId: day.videoId, postDate: date });
    }
  }

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  }

  function nextMonth() {
    const now = new Date();
    if (calYear === now.getFullYear() && calMonth === now.getMonth()) return;
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  }

  const followBtnLabel = profile.isFollowing
    ? 'Following'
    : profile.isFollowRequested
    ? 'Requested'
    : profile.privacyMode === 'PRIVATE'
    ? 'Request to follow'
    : 'Follow';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          {isOwnProfile ? (
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Settings">
              <Feather name="settings" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Back">
              <Feather name="arrow-left" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
          {!isOwnProfile && (
            <TouchableOpacity style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="More options">
              <Feather name="more-horizontal" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile info */}
        <View style={styles.profileInfo}>
          <Avatar
            uri={profile.profilePictureUrl}
            name={profile.name}
            username={profile.username}
            size={80}
            onPress={isOwnProfile ? () => navigation.navigate('EditProfile') : undefined}
          />
          <View style={styles.nameBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile.name}</Text>
              {profile.isVerified && <Feather name="check-circle" size={15} color={Colors.accent} />}
            </View>
            <Text style={styles.username}>@{profile.username}</Text>
            {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'memories', value: profile.totalPostsDays, onPress: () => {} },
            { label: 'streak', value: `${profile.currentStreak}d`, onPress: () => isOwnProfile && navigation.navigate('StreakScreen') },
            { label: 'followers', value: formatNumber(profile.followersCount ?? 0), onPress: () => navigation.navigate('Followers', { username }) },
            { label: 'following', value: formatNumber(profile.followingCount ?? 0), onPress: () => navigation.navigate('Following', { username }) },
          ].map((stat) => (
            <TouchableOpacity key={stat.label} style={styles.stat} onPress={stat.onPress} accessibilityRole="button">
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {isOwnProfile ? (
            <Button label="Edit profile" onPress={() => navigation.navigate('EditProfile')} variant="secondary" fullWidth />
          ) : (
            <Button
              label={followBtnLabel}
              onPress={() => followMutation.mutate()}
              loading={followMutation.isPending}
              variant={profile.isFollowing ? 'secondary' : 'primary'}
              fullWidth
            />
          )}
        </View>

        {/* View mode toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'calendar' && styles.toggleBtnActive]}
            onPress={() => setViewMode('calendar')}
            accessibilityRole="button"
            accessibilityLabel="Calendar view"
          >
            <Feather name="calendar" size={16} color={viewMode === 'calendar' ? Colors.accent : Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
            accessibilityRole="button"
            accessibilityLabel="List view"
          >
            <Feather name="list" size={16} color={viewMode === 'list' ? Colors.accent : Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {viewMode === 'calendar' && (
          <View style={styles.calendarWrap}>
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={prevMonth} accessibilityRole="button" accessibilityLabel="Previous month">
                <Feather name="chevron-left" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{formatMonthYear(calYear, calMonth)}</Text>
              <TouchableOpacity onPress={nextMonth} accessibilityRole="button" accessibilityLabel="Next month">
                <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <CalendarView
              calendarData={calendar ?? {}}
              year={calYear}
              month={calMonth}
              onDayPress={handleDayPress}
            />
          </View>
        )}

        {viewMode === 'list' && (
          <View style={{ paddingHorizontal: 16 }}>
            {videos?.items.map((video) => <VideoCard key={video.id} video={video} />)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerBtn: { padding: 4 },
  profileInfo: { flexDirection: 'row', gap: 16, paddingHorizontal: 16, paddingBottom: 16, alignItems: 'flex-start' },
  nameBlock: { flex: 1, paddingTop: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  username: { color: Colors.textSecondary, fontSize: 14, marginTop: 2 },
  bio: { color: Colors.textSecondary, fontSize: 14, marginTop: 8, lineHeight: 20 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 16, gap: 0 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  statLabel: { color: Colors.textMuted, fontSize: 11 },
  actions: { paddingHorizontal: 16, marginBottom: 16 },
  viewToggle: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  toggleBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent },
  calendarWrap: { paddingHorizontal: 16, paddingVertical: 12 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthLabel: { color: Colors.text, fontSize: 16, fontWeight: '600' },
});
