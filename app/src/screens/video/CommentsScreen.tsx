import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput as RNTextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { RootStackParamList, Comment } from '@/types';
import { commentsApi } from '@/api/comments';
import { Avatar } from '@/components/common/Avatar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { formatRelativeTime } from '@/utils/date';

type RouteType = RouteProp<RootStackParamList, 'Comments'>;

export function CommentsScreen() {
  const route = useRoute<RouteType>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { videoId } = route.params;
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const inputRef = useRef<RNTextInput>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['comments', videoId],
    queryFn: ({ pageParam }) => commentsApi.getComments(videoId, pageParam as string | undefined),
    getNextPageParam: (last) => last.hasMore ? last.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
  });

  const comments = data?.pages.flatMap((p) => p.items) ?? [];

  const createMutation = useMutation({
    mutationFn: () => commentsApi.createComment(videoId, text.trim(), replyTo?.id),
    onSuccess: () => {
      setText('');
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ['comments', videoId] });
    },
    onError: () => Alert.alert('Error', 'Failed to post comment.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => commentsApi.deleteComment(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', videoId] }),
  });

  function handleReply(comment: Comment) {
    setReplyTo(comment);
    inputRef.current?.focus();
  }

  function isEditable(comment: Comment): boolean {
    return new Date(comment.editableUntil) > new Date();
  }

  function renderComment({ item }: { item: Comment }) {
    const canDelete = item.userId === user?.id;
    const canEdit = item.userId === user?.id && isEditable(item);
    const editSecs = Math.max(0, Math.round((new Date(item.editableUntil).getTime() - Date.now()) / 1000));

    return (
      <View style={styles.comment}>
        <Avatar uri={item.user.profilePictureUrl} name={item.user.name} username={item.user.username} size={32} />
        <View style={styles.commentBody}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentUser}>{item.user.username}</Text>
            <Text style={styles.commentTime}>{formatRelativeTime(item.createdAt)}</Text>
            {item.isEdited && <Text style={styles.editedBadge}>edited</Text>}
          </View>
          <Text style={styles.commentText}>{item.body}</Text>
          <View style={styles.commentActions}>
            <TouchableOpacity onPress={() => handleReply(item)} accessibilityRole="button" accessibilityLabel="Reply">
              <Text style={styles.commentAction}>Reply</Text>
            </TouchableOpacity>
            {canEdit && editSecs > 0 && (
              <Text style={styles.editableTimer}>{Math.floor(editSecs / 60)}m {editSecs % 60}s to edit</Text>
            )}
            {canDelete && (
              <TouchableOpacity
                onPress={() => Alert.alert('Delete comment?', '', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
                ])}
                accessibilityRole="button"
              >
                <Text style={[styles.commentAction, { color: Colors.error }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Replies */}
          {item.replies?.map((reply) => (
            <View key={reply.id} style={styles.reply}>
              <Avatar uri={reply.user.profilePictureUrl} name={reply.user.name} username={reply.user.username} size={24} />
              <View style={styles.replyBody}>
                <Text style={styles.replyUser}>{reply.user.username}</Text>
                <Text style={styles.commentText}>{reply.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            ListEmptyComponent={<EmptyState icon="message-circle" title="No comments yet" message="Be the first to comment." />}
            onEndReached={() => hasNextPage && fetchNextPage()}
            onEndReachedThreshold={0.3}
            ListFooterComponent={isFetchingNextPage ? <LoadingSpinner size="small" /> : null}
            contentContainerStyle={styles.list}
          />
        )}

        {/* Reply indicator */}
        {replyTo && (
          <View style={styles.replyIndicator}>
            <Text style={styles.replyIndicatorText}>Replying to {replyTo.user.username}</Text>
            <TouchableOpacity onPress={() => setReplyTo(null)} accessibilityRole="button" accessibilityLabel="Cancel reply">
              <Feather name="x" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <Avatar uri={user?.profilePictureUrl} name={user?.name} username={user?.username} size={30} />
          <RNTextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={replyTo ? `Reply to ${replyTo.user.username}...` : 'Add a comment...'}
            placeholderTextColor={Colors.textMuted}
            maxLength={500}
            multiline
          />
          <TouchableOpacity
            onPress={() => text.trim() && createMutation.mutate()}
            disabled={!text.trim() || createMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel="Post comment"
          >
            <Feather name="send" size={20} color={text.trim() ? Colors.accent : Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, paddingBottom: 8 },
  comment: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  commentUser: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  commentTime: { color: Colors.textMuted, fontSize: 11 },
  editedBadge: { color: Colors.textMuted, fontSize: 10, fontStyle: 'italic' },
  commentText: { color: Colors.text, fontSize: 14, lineHeight: 20 },
  commentActions: { flexDirection: 'row', gap: 12, marginTop: 5, alignItems: 'center' },
  commentAction: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' },
  editableTimer: { color: Colors.textMuted, fontSize: 11 },
  reply: { flexDirection: 'row', gap: 8, marginTop: 10, marginLeft: 8 },
  replyBody: { flex: 1 },
  replyUser: { color: Colors.text, fontSize: 12, fontWeight: '600', marginBottom: 2 },
  replyIndicator: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Colors.backgroundElevated, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  replyIndicatorText: { color: Colors.textSecondary, fontSize: 13 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1, color: Colors.text, fontSize: 15,
    maxHeight: 100, paddingVertical: 4,
  },
});
