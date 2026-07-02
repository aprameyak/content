import { apiClient, extractData } from './client';
import { User, Community } from '@/types';

export const searchApi = {
  searchUsers: (q: string) =>
    apiClient.get<{ success: true; data: User[] }>('/search/users', { params: { q } }).then(extractData),

  searchCommunities: (q: string) =>
    apiClient
      .get<{ success: true; data: Community[] }>('/search/communities', { params: { q } })
      .then(extractData),
};
