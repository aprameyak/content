import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
  const [count, setCount] = React.useState(3);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1.5);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    animate();
  }, []);

  useEffect(() => {
    if (count <= 0) return;
    opacity.value = 0;
    scale.value = 1.5;
    opacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(1, { duration: 650 }),
      withTiming(0, { duration: 200 }),
    );
    scale.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0.9, { duration: 700 }),
      withTiming(0.7, { duration: 150 }),
    );
  }, [count]);

  function animate() {
    const interval = setInterval(() => {
      setCount((c) => {
        const next = c - 1;
        if (next <= 0) {
          clearInterval(interval);
          setTimeout(onComplete, 200);
        }
        return next;
      });
    }, 1000);
  }

  if (count <= 0) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.Text style={[styles.number, animStyle]}>{count}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  number: {
    color: Colors.white,
    fontSize: 120,
    fontWeight: '800',
  },
});
