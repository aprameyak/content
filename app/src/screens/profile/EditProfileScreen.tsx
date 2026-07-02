import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';
import { TextInput } from '@/components/common/TextInput';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { usersApi } from '@/api/users';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [errors, setErrors] = useState<{ name?: string }>({});

  const updateMutation = useMutation({
    mutationFn: () => usersApi.updateMe({ name, bio }),
    onSuccess: async () => {
      await refreshUser();
      navigation.goBack();
    },
    onError: () => Alert.alert('Error', 'Failed to save changes.'),
  });

  function validate(): boolean {
    const errs: { name?: string } = {};
    if (!name.trim()) errs.name = 'Name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (validate()) updateMutation.mutate();
  }

  async function handlePickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      // In production: upload the image and get URL
      Alert.alert('Profile picture', 'Profile picture upload coming soon.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <Avatar
              uri={user?.profilePictureUrl}
              name={user?.name}
              username={user?.username}
              size={80}
              onPress={handlePickImage}
            />
            <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickImage} accessibilityRole="button">
              <Text style={styles.changePhotoText}>Change photo</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            error={errors.name}
            autoCapitalize="words"
          />

          <View style={styles.staticField}>
            <Text style={styles.staticLabel}>Username</Text>
            <Text style={styles.staticValue}>@{user?.username}</Text>
            <Text style={styles.staticNote}>Usernames cannot be changed after registration.</Text>
          </View>

          <TextInput
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell people a little about yourself..."
            multiline
            numberOfLines={3}
            maxLength={160}
          />

          <View style={styles.staticField}>
            <Text style={styles.staticLabel}>Birthday</Text>
            <Text style={styles.staticValue}>{user?.birthday ? new Date(user.birthday).toLocaleDateString() : '—'}</Text>
            <Text style={styles.staticNote}>Contact support to change your birthday.</Text>
          </View>

          <Button
            label="Save changes"
            onPress={handleSave}
            loading={updateMutation.isPending}
            fullWidth
            size="lg"
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  avatarWrap: { alignItems: 'center', marginBottom: 28, gap: 10 },
  changePhotoBtn: {},
  changePhotoText: { color: Colors.accent, fontSize: 15, fontWeight: '500' },
  staticField: { marginBottom: 16 },
  staticLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 4 },
  staticValue: { color: Colors.text, fontSize: 16, paddingVertical: 6 },
  staticNote: { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
});
