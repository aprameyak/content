import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/common/Button';
import { TextInput } from '@/components/common/TextInput';
import { useRecordingStore } from '@/store/recordingStore';
import { videosApi } from '@/api/videos';
import { communitiesApi } from '@/api/communities';
import { MOODS, MAX_DESCRIPTION_LENGTH } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system';

export function PostDetailsScreen() {
  const store = useRecordingStore();
  const queryClient = useQueryClient();
  const [description, setDescription] = useState('');
  const [mood, setMood] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);

  const { data: communities } = useQuery({
    queryKey: ['my-communities'],
    queryFn: async () => {
      const all = await communitiesApi.getCommunities();
      return all.filter((c) => c.isMember);
    },
  });

  function toggleCommunity(id: string) {
    setSelectedCommunities((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  async function handlePost() {
    if (!store.sessionId || !store.recordingUri) {
      Alert.alert('Error', 'Recording session not found. Please try again.');
      return;
    }

    setPosting(true);
    store.setUploading(0);

    try {
      // Upload in chunks
      const fileInfo = await FileSystem.getInfoAsync(store.recordingUri, { size: true });
      const fileSize = (fileInfo as any).size ?? 0;

      // Simple single-chunk upload for now (in production, chunk it)
      const formData = new FormData();
      formData.append('chunk', {
        uri: store.recordingUri,
        type: 'video/mp4',
        name: 'recording.mp4',
      } as any);

      store.setUploading(30);
      await videosApi.uploadChunk(store.sessionId, formData);
      store.setUploading(60);
      await videosApi.completeUpload(store.sessionId);
      store.setUploading(80);

      const video = await videosApi.publishVideo({
        sessionId: store.sessionId,
        duration: store.duration,
        fileSize,
        description: description || undefined,
        location: location || undefined,
        mood: mood || undefined,
        communityIds: selectedCommunities,
      });

      store.setUploading(100);
      queryClient.invalidateQueries({ queryKey: ['daily-status'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });

      store.setPublished(video.id);
    } catch (e: any) {
      store.setPhase('details');
      Alert.alert('Upload failed', e?.response?.data?.error?.message || 'Please try again.');
    } finally {
      setPosting(false);
    }
  }

  function handleDiscard() {
    Alert.alert(
      'Discard video?',
      'Your recording will be permanently discarded.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            if (store.sessionId) {
              await videosApi.discardUpload(store.sessionId).catch(() => {});
            }
            store.reset();
          },
        },
      ],
    );
  }

  if (store.phase === 'uploading') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.uploadingContainer}>
          <Feather name="upload-cloud" size={48} color={Colors.accent} />
          <Text style={styles.uploadingTitle}>Posting your memory...</Text>
          <Text style={styles.uploadingBody}>Don't close the app.</Text>
          <View style={styles.uploadBar}>
            <View style={[styles.uploadFill, { width: `${store.uploadProgress}%` }]} />
          </View>
          <Text style={styles.uploadPercent}>{Math.round(store.uploadProgress)}%</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => store.setPhase('preview')} accessibilityRole="button" accessibilityLabel="Go back to preview">
              <Feather name="arrow-left" size={22} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Add details</Text>
            <View style={{ width: 22 }} />
          </View>

          <Text style={styles.hint}>Optional — everything below is optional.</Text>

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What happened today? (optional)"
            multiline
            numberOfLines={3}
            maxLength={MAX_DESCRIPTION_LENGTH}
          />

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Location</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Add a place..."
              containerStyle={{ marginBottom: 0 }}
            />
          </View>

          {/* Mood */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Mood</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodRow}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.moodPill, mood === m && styles.moodPillSelected]}
                  onPress={() => setMood(mood === m ? '' : m)}
                  accessibilityRole="button"
                  accessibilityLabel={m}
                >
                  <Text style={[styles.moodText, mood === m && styles.moodTextSelected]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Communities */}
          {communities && communities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Share to communities</Text>
              {communities.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.communityRow, selectedCommunities.includes(c.id) && styles.communityRowSelected]}
                  onPress={() => toggleCommunity(c.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selectedCommunities.includes(c.id) }}
                >
                  <Feather
                    name={selectedCommunities.includes(c.id) ? 'check-square' : 'square'}
                    size={18}
                    color={selectedCommunities.includes(c.id) ? Colors.accent : Colors.textMuted}
                  />
                  <Text style={styles.communityName}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <Button label="Post memory" onPress={handlePost} loading={posting} fullWidth size="lg" />
            <Button label="Discard" onPress={handleDiscard} variant="ghost" fullWidth style={{ marginTop: 4 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, gap: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  hint: { color: Colors.textMuted, fontSize: 13, marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 8 },
  moodRow: { flexDirection: 'row' },
  moodPill: {
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.backgroundElevated, marginRight: 8,
  },
  moodPillSelected: { borderColor: Colors.accent, backgroundColor: Colors.accentSurface },
  moodText: { color: Colors.textSecondary, fontSize: 13 },
  moodTextSelected: { color: Colors.accentLight, fontWeight: '600' },
  communityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    marginBottom: 8, backgroundColor: Colors.backgroundElevated,
  },
  communityRowSelected: { borderColor: Colors.accent },
  communityName: { color: Colors.text, fontSize: 15 },
  actions: { marginTop: 16, gap: 0 },

  uploadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  uploadingTitle: { color: Colors.text, fontSize: 22, fontWeight: '700' },
  uploadingBody: { color: Colors.textSecondary, fontSize: 14 },
  uploadBar: { width: '100%', height: 4, backgroundColor: Colors.backgroundElevated, borderRadius: 2, marginTop: 8 },
  uploadFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
  uploadPercent: { color: Colors.textMuted, fontSize: 14 },
});
