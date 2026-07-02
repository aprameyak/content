import { apiClient, extractData } from './client';
import { Community, Video, PaginatedResponse } from '@/types';

export const communitiesApi = {
  getCommunities: () =>
    apiClient.get<{ success: true; data: Community[] }>('/communities').then(extractData),

  getCommunity: (slug: string) =>
    apiClient.get<{ success: true; data: Community }>(`/communities/${slug}`).then(extractData),

  createCommunity: (data: { name: string; slug: string; description?: string; isPrivate?: boolean }) =>
    apiClient.post<{ success: true; data: Community }>('/communities', data).then(extractData),

  getCommunityFeed: (slug: string, cursor?: string) =>
    apiClient
      .get<{ success: true; data: PaginatedResponse<Video> }>(`/communities/${slug}/feed`, {
        params: { cursor },
      })
      .then(extractData),

  getMembers: (slug: string) =>
    apiClient.get(`/communities/${slug}/members`).then(extractData),

  joinCommunity: (slug: string) =>
    apiClient.post(`/communities/${slug}/join`),

  leaveCommunity: (slug: string) =>
    apiClient.delete(`/communities/${slug}/leave`),
};
