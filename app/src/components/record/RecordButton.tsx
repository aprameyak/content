import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';

interface RecordButtonProps {
  isRecording: boolean;
  canStop: boolean;
  onPress: () => void;
  size?: number;
}

export function RecordButton({ isRecording, canStop, onPress, size = 80 }: RecordButtonProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      scale.value = withTiming(1);
    }
  }, [isRecording]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    if (isRecording && !canStop) return;
    Haptics.impactAsync(
      isRecording
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Heavy,
    );
    onPress();
  }

  const outerSize = size + 20;

  return (
    <Animated.View style={[{ width: outerSize, height: outerSize, borderRadius: outerSize / 2 }, animStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={isRecording && !canStop}
        activeOpacity={0.8}
        style={[styles.outer, { width: outerSize, height: outerSize, borderRadius: outerSize / 2 }]}
        accessibilityRole="button"
        accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
      >
        <View
          style={[
            styles.inner,
            {
              width: size,
              height: size,
              borderRadius: isRecording ? 12 : size / 2,
              backgroundColor: isRecording ? Colors.recordingRed : Colors.white,
            },
          ]}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 3,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.95,
  },
  inner: {
    // dynamic sizing
  },
});
