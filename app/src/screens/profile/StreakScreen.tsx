import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { usersApi } from '@/api/users';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { STREAK_MILESTONES } from '@/constants';

export function StreakScreen() {
  const { data: streak, isLoading } = useQuery({
    queryKey: ['streak'],
    queryFn: usersApi.getStreak,
  });

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!streak) return null;

  const milestoneProgress = streak.nextMilestone
    ? (streak.currentStreak / streak.nextMilestone) * 100
    : 100;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current streak */}
        <View style={styles.heroCard}>
          <Text style={styles.streakEmoji}>{streak.currentStreak > 0 ? '🔥' : '💤'}</Text>
          <Text style={styles.streakNumber}>{streak.currentStreak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Longest streak', value: `${streak.longestStreak} days` },
            { label: 'Total memories', value: String(streak.totalPostsDays) },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Next milestone */}
        {streak.nextMilestone && (
          <View style={styles.milestoneCard}>
            <View style={styles.milestoneHeader}>
              <Text style={styles.milestoneTitle}>Next milestone</Text>
              <Text style={styles.milestoneTarget}>{streak.nextMilestone} days</Text>
            </View>
            <View style={styles.milestoneBar}>
              <View style={[styles.milestoneFill, { width: `${Math.min(milestoneProgress, 100)}%` }]} />
            </View>
            <Text style={styles.milestoneRemaining}>
              {streak.nextMilestone - streak.currentStreak} days to go
            </Text>
          </View>
        )}

        {/* All milestones */}
        <Text style={styles.sectionTitle}>Milestones</Text>
        {STREAK_MILESTONES.map((milestone) => {
          const reached = streak.longestStreak >= milestone;
          return (
            <View key={milestone} style={[styles.milestoneRow, reached && styles.milestoneRowReached]}>
              <View style={[styles.milestoneBadge, reached && styles.milestoneBadgeReached]}>
                <Feather name={reached ? 'award' : 'lock'} size={18} color={reached ? Colors.accent : Colors.textMuted} />
              </View>
              <Text style={[styles.milestoneDays, !reached && styles.milestoneNotReached]}>
                {milestone} {milestone === 1 ? 'day' : 'days'}
              </Text>
              {reached && <Feather name="check" size={16} color={Colors.success} />}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, gap: 16 },
  heroCard: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.backgroundElevated, borderRadius: 20,
    paddingVertical: 40, borderWidth: 1, borderColor: Colors.border,
  },
  streakEmoji: { fontSize: 56 },
  streakNumber: { color: Colors.text, fontSize: 72, fontWeight: '800', lineHeight: 80 },
  streakLabel: { color: Colors.textSecondary, fontSize: 18 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: Colors.backgroundElevated,
    borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { color: Colors.text, fontSize: 22, fontWeight: '700' },
  statLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  milestoneCard: {
    backgroundColor: Colors.backgroundElevated, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  milestoneHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  milestoneTitle: { color: Colors.textSecondary, fontSize: 14 },
  milestoneTarget: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
  milestoneBar: { height: 6, backgroundColor: Colors.background, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  milestoneFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  milestoneRemaining: { color: Colors.textMuted, fontSize: 13 },
  sectionTitle: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  milestoneRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
  },
  milestoneRowReached: { borderColor: Colors.accentDim, backgroundColor: Colors.accentSurface },
  milestoneBadge: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.backgroundElevated, alignItems: 'center', justifyContent: 'center',
  },
  milestoneBadgeReached: { backgroundColor: Colors.accent + '20' },
  milestoneDays: { flex: 1, color: Colors.text, fontSize: 15, fontWeight: '500' },
  milestoneNotReached: { color: Colors.textMuted },
});
