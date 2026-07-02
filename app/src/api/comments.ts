import { apiClient, extractData } from './client';
import { Comment, PaginatedResponse } from '@/types';

export const commentsApi = {
  getComments: (videoId: string, cursor?: string) =>
    apiClient
      .get<{ success: true; data: PaginatedResponse<Comment> }>(`/comments/videos/${videoId}/comments`, {
        params: { cursor },
      })
      .then(extractData),

  createComment: (videoId: string, body: string, parentId?: string) =>
    apiClient
      .post<{ success: true; data: Comment }>(`/comments/videos/${videoId}/comments`, { body, parentId })
      .then(extractData),

  editComment: (commentId: string, body: string) =>
    apiClient
      .patch<{ success: true; data: Comment }>(`/comments/${commentId}`, { body })
      .then(extractData),

  deleteComment: (commentId: string) =>
    apiClient.delete(`/comments/${commentId}`),
};
