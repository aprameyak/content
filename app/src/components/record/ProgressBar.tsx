import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { MAX_VIDEO_DURATION, MIN_VIDEO_DURATION } from '@/constants';

interface ProgressBarProps {
  elapsed: number; // seconds
}

export function ProgressBar({ elapsed }: ProgressBarProps) {
  const progress = Math.min(elapsed / MAX_VIDEO_DURATION, 1);
  const isInMinZone = elapsed < MIN_VIDEO_DURATION;

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress * 100}%`,
    backgroundColor: isInMinZone ? Colors.warning : elapsed > 90 ? Colors.recordingRed : Colors.accent,
  }));

  // Min duration marker at 15%
  const minMarkerLeft = (MIN_VIDEO_DURATION / MAX_VIDEO_DURATION) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
        <View style={[styles.minMarker, { left: `${minMarkerLeft}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingVertical: 8 },
  track: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'visible',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  minMarker: {
    position: 'absolute',
    top: -4,
    width: 2,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 1,
  },
});
