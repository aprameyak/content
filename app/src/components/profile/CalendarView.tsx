import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Colors } from '@/constants/colors';
import { CalendarDay } from '@/types';
import { getDaysInMonth, getFirstDayOfMonth, getLocalDateString } from '@/utils/date';

interface CalendarViewProps {
  calendarData: Record<string, CalendarDay>;
  year: number;
  month: number; // 0-indexed
  onDayPress: (date: string) => void;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarView({ calendarData, year, month, onDayPress }: CalendarViewProps) {
  const today = getLocalDateString();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month); // 0 = Sunday

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  function getDateStr(day: number): string {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  function isFuture(day: number): boolean {
    return getDateStr(day) > today;
  }

  function isToday(day: number): boolean {
    return getDateStr(day) === today;
  }

  return (
    <View style={styles.container}>
      {/* Day headers */}
      <View style={styles.headerRow}>
        {DAY_LABELS.map((d, i) => (
          <View key={i} style={styles.headerCell}>
            <Text style={styles.headerText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) {
            return <View key={`empty-${i}`} style={styles.cell} />;
          }

          const dateStr = getDateStr(day);
          const calDay = calendarData[dateStr];
          const posted = !!calDay;
          const future = isFuture(day);
          const todayDay = isToday(day);

          return (
            <TouchableOpacity
              key={dateStr}
              style={[
                styles.cell,
                posted && styles.cellPosted,
                todayDay && styles.cellToday,
                future && styles.cellFuture,
              ]}
              onPress={() => posted && onDayPress(dateStr)}
              disabled={!posted}
              activeOpacity={posted ? 0.7 : 1}
              accessibilityLabel={posted ? `${dateStr}, video posted` : `${dateStr}, no video`}
              accessibilityRole={posted ? 'button' : 'text'}
            >
              {posted && calDay.thumbnailUrl ? (
                <Image source={{ uri: calDay.thumbnailUrl }} style={styles.thumbnail} />
              ) : (
                <Text style={[styles.dayText, future && styles.dayTextFuture, todayDay && styles.dayTextToday]}>
                  {day}
                </Text>
              )}
              {todayDay && !posted && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const CELL_SIZE = 44;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 4 },
  headerRow: { flexDirection: 'row', marginBottom: 4 },
  headerCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  headerText: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  cellPosted: {
    // thumbnail handles background
  },
  cellToday: {
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  cellFuture: { opacity: 0.3 },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    backgroundColor: Colors.backgroundElevated,
  },
  dayText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  dayTextFuture: { color: Colors.textDisabled },
  dayTextToday: { color: Colors.accent, fontWeight: '700' },
  todayDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
});
