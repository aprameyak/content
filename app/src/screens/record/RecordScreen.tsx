import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, AppState, AppStateStatus, Platform,
} from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { RecordButton } from '@/components/record/RecordButton';
import { CountdownOverlay } from '@/components/record/CountdownOverlay';
import { ProgressBar } from '@/components/record/ProgressBar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/common/Button';
import { useCamera } from '@/hooks/useCamera';
import { useDaily } from '@/hooks/useDaily';
import { useCountdown } from '@/hooks/useCountdown';
import { useRecordingStore } from '@/store/recordingStore';
import { MIN_VIDEO_DURATION, MAX_VIDEO_DURATION } from '@/constants';
import { pad2 } from '@/utils/format';
import { PostDetailsScreen } from './PostDetailsScreen';

export function RecordScreen() {
  const { hasAllPermissions, requestPermissions } = useCamera();
  const { data: dailyStatus } = useDaily();
  const store = useRecordingStore();
  const navigation = useNavigation();

  const cameraRef = useRef<CameraView>(null);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [showCountdown, setShowCountdown] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const countdown = useCountdown(dailyStatus?.nextPostAvailableAt);

  useFocusEffect(
    useCallback(() => {
      // Reset on focus if not in active recording/uploading
      if (store.phase === 'published') {
        store.reset();
      }
    }, [store.phase]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (
        appStateRef.current === 'active' &&
        state !== 'active' &&
        store.phase === 'recording'
      ) {
        stopRecording();
      }
      appStateRef.current = state;
    });
    return () => sub.remove();
  }, [store.phase]);

  useEffect(() => {
    if (store.phase === 'recording') {
      timerRef.current = setInterval(() => {
        setElapsed((e) => {
          if (e >= MAX_VIDEO_DURATION) {
            stopRecording();
            return MAX_VIDEO_DURATION;
          }
          return e + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [store.phase]);

  // Already posted today
  if (dailyStatus?.hasPosted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.alreadyPosted}>
          <Feather name="check-circle" size={48} color={Colors.success} />
          <Text style={styles.alreadyTitle}>Today's memory captured</Text>
          <Text style={styles.alreadyBody}>
            You've already posted today. Come back tomorrow.
          </Text>
          {!countdown.isExpired && (
            <Text style={styles.countdownText}>{countdown.formatted}</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (!hasAllPermissions) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.permContainer}>
          <Feather name="camera-off" size={48} color={Colors.textMuted} />
          <Text style={styles.permTitle}>Camera access needed</Text>
          <Text style={styles.permBody}>
            Chronicle needs camera and microphone access to record your daily memory.
          </Text>
          <Button label="Allow access" onPress={requestPermissions} size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  if (store.phase === 'details') {
    return <PostDetailsScreen />;
  }

  if (store.phase === 'published') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.successContainer}>
          <Feather name="check-circle" size={56} color={Colors.success} />
          <Text style={styles.successTitle}>Memory captured.</Text>
          <Text style={styles.successBody}>Your video has been posted for today.</Text>
          <Button
            label="View it"
            onPress={() => {
              if (store.publishedVideoId) {
                navigation.navigate('VideoPlayer' as never, { videoId: store.publishedVideoId } as never);
              }
              store.reset();
            }}
            style={{ marginTop: 24 }}
          />
          <Button label="Go home" onPress={() => { store.reset(); }} variant="ghost" style={{ marginTop: 8 }} />
        </View>
      </SafeAreaView>
    );
  }

  async function startRecording() {
    setShowCountdown(true);
    setElapsed(0);
  }

  function onCountdownComplete() {
    setShowCountdown(false);
    store.setPhase('recording');
    cameraRef.current?.recordAsync({
      maxDuration: MAX_VIDEO_DURATION,
    }).then((result) => {
      if (result?.uri) {
        store.setRecordingComplete(result.uri, elapsed, 0);
      }
    }).catch(() => {
      store.setPhase('idle');
    });
  }

  async function stopRecording() {
    if (store.phase !== 'recording') return;
    if (elapsed < MIN_VIDEO_DURATION) {
      Alert.alert(
        'Too short',
        `Videos must be at least ${MIN_VIDEO_DURATION} seconds. Keep recording.`,
      );
      return;
    }
    cameraRef.current?.stopRecording();
  }

  function handleRecordPress() {
    if (store.phase === 'idle') {
      startRecording();
    } else if (store.phase === 'recording') {
      stopRecording();
    }
  }

  function handleDiscard() {
    Alert.alert(
      'Discard recording?',
      'Your video will not be saved.',
      [
        { text: 'Keep recording', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            if (store.phase === 'recording') {
              cameraRef.current?.stopRecording();
            }
            setElapsed(0);
            store.reset();
          },
        },
      ],
    );
  }

  function handleContinueFromPreview() {
    store.setPhase('details');
  }

  const remaining = MAX_VIDEO_DURATION - elapsed;
  const canStop = elapsed >= MIN_VIDEO_DURATION;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.black }}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={cameraFacing}
        mode="video"
      />

      {/* Countdown overlay */}
      {showCountdown && <CountdownOverlay onComplete={onCountdownComplete} />}

      {store.phase !== 'recording' && !showCountdown && (
        <>
          {/* Header */}
          <SafeAreaView style={styles.header} edges={['top']}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Close camera">
              <Feather name="x" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerHint}>Max {MAX_VIDEO_DURATION}s · Min {MIN_VIDEO_DURATION}s</Text>
            <TouchableOpacity
              onPress={() => setCameraFacing((f) => (f === 'back' ? 'front' : 'back'))}
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="Flip camera"
            >
              <Feather name="refresh-cw" size={22} color={Colors.white} />
            </TouchableOpacity>
          </SafeAreaView>
        </>
      )}

      {store.phase === 'recording' && (
        <>
          {/* REC indicator */}
          <SafeAreaView style={styles.recHeader} edges={['top']}>
            <View style={styles.recBadge}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>REC</Text>
            </View>
            <View style={styles.timerCenter}>
              <Text style={styles.elapsedTime}>{pad2(Math.floor(elapsed / 60))}:{pad2(elapsed % 60)}</Text>
            </View>
            <Text style={styles.remainingTime}>-{pad2(Math.floor(remaining / 60))}:{pad2(remaining % 60)}</Text>
          </SafeAreaView>

          <View style={styles.progressWrap}>
            <ProgressBar elapsed={elapsed} />
          </View>
        </>
      )}

      {/* Record button area */}
      <SafeAreaView style={styles.controls} edges={['bottom']}>
        {store.phase === 'idle' && (
          <View style={styles.controlsRow}>
            <View style={{ width: 60 }} />
            <RecordButton
              isRecording={false}
              canStop={false}
              onPress={handleRecordPress}
            />
            <View style={{ width: 60 }} />
          </View>
        )}

        {store.phase === 'recording' && (
          <View style={styles.controlsRow}>
            <View style={{ width: 60 }} />
            <RecordButton
              isRecording={true}
              canStop={canStop}
              onPress={handleRecordPress}
            />
            {!canStop && (
              <Text style={styles.minHint}>{MIN_VIDEO_DURATION - elapsed}s min</Text>
            )}
          </View>
        )}

        {store.phase === 'preview' && (
          <View style={styles.previewControls}>
            <Button label="Discard" onPress={handleDiscard} variant="ghost" style={styles.discardBtn} />
            <Button label="Continue" onPress={handleContinueFromPreview} style={styles.continueBtn} />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8,
  },
  headerBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20 },
  headerHint: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  recHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8,
  },
  recBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.recordingRed },
  recText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  timerCenter: { flex: 1, alignItems: 'center' },
  elapsedTime: { color: Colors.white, fontSize: 22, fontWeight: '600', fontVariant: ['tabular-nums'] },
  remainingTime: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontVariant: ['tabular-nums'] },
  progressWrap: { position: 'absolute', bottom: 130, left: 0, right: 0 },
  controls: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40, paddingBottom: 24, paddingTop: 12 },
  minHint: { color: 'rgba(255,255,255,0.6)', fontSize: 12, width: 60, textAlign: 'center' },
  previewControls: { flexDirection: 'row', gap: 16, padding: 24 },
  discardBtn: { flex: 1 },
  continueBtn: { flex: 1 },

  alreadyPosted: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  alreadyTitle: { color: Colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  alreadyBody: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  countdownText: { color: Colors.accent, fontSize: 28, fontWeight: '600', fontVariant: ['tabular-nums'] },

  permContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  permTitle: { color: Colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  permBody: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 8 },

  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  successTitle: { color: Colors.text, fontSize: 28, fontWeight: '700', marginTop: 20 },
  successBody: { color: Colors.textSecondary, fontSize: 16, marginTop: 8 },
});
