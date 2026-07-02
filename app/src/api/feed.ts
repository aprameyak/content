import { apiClient, extractData } from './client';
import { Video, PaginatedResponse } from '@/types';

export const feedApi = {
  getFeed: (cursor?: string, sort?: 'chronological' | 'close-friends-first') =>
    apiClient
      .get<{ success: true; data: PaginatedResponse<Video> }>('/feed', { params: { cursor, sort } })
      .then(extractData),

  getFeedForDate: (date: string) =>
    apiClient
      .get<{ success: true; data: { items: Video[] } }>(`/feed/date/${date}`)
      .then(extractData),
};
