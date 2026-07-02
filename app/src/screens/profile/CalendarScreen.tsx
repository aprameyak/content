import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { RootStackParamList } from '@/types';
import { usersApi } from '@/api/users';
import { CalendarView } from '@/components/profile/CalendarView';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatMonthYear } from '@/utils/date';

type RouteType = RouteProp<RootStackParamList, 'CalendarScreen'>;

const now = new Date();

export function CalendarScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { username } = route.params;

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const { data: calendar, isLoading } = useQuery({
    queryKey: ['calendar', username],
    queryFn: () => usersApi.getUserCalendar(username),
  });

  function prev() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }

  function next() {
    if (year === now.getFullYear() && month === now.getMonth()) return;
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prev} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="Previous month">
          <Feather name="chevron-left" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{formatMonthYear(year, month)}</Text>
        <TouchableOpacity onPress={next} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="Next month">
          <Feather name="chevron-right" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ScrollView>
          <CalendarView
            calendarData={calendar ?? {}}
            year={year}
            month={month}
            onDayPress={(date) => {
              const day = calendar?.[date];
              if (day?.videoId) {
                navigation.navigate('VideoPlayer', { videoId: day.videoId, postDate: date });
              }
            }}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  navBtn: { padding: 4 },
  monthLabel: { color: Colors.text, fontSize: 18, fontWeight: '700' },
});
