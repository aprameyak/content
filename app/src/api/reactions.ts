import { apiClient, extractData } from './client';
import { ReactionType, ReactionCounts } from '@/types';

interface ReactionsData {
  counts: ReactionCounts;
  userReaction: ReactionType | null;
}

export const reactionsApi = {
  getReactions: (videoId: string) =>
    apiClient
      .get<{ success: true; data: ReactionsData }>(`/reactions/videos/${videoId}`)
      .then(extractData),

  addReaction: (videoId: string, type: ReactionType) =>
    apiClient.post(`/reactions/videos/${videoId}`, { type }),

  removeReaction: (videoId: string) =>
    apiClient.delete(`/reactions/videos/${videoId}`),
};
