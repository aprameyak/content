import { apiClient, extractData } from './client';
import { User, Video, CalendarDay, PaginatedResponse, StreakInfo, DailyStatus } from '@/types';

export const usersApi = {
  getMe: () =>
    apiClient.get<{ success: true; data: User & { email: string } }>('/users/me').then(extractData),

  updateMe: (data: Partial<User> & { email?: string }) =>
    apiClient.patch<{ success: true; data: User }>('/users/me', data).then(extractData),

  deleteAccount: () => apiClient.delete('/users/me'),

  getUserProfile: (username: string) =>
    apiClient.get<{ success: true; data: User }>(`/users/${username}`).then(extractData),

  getUserVideos: (username: string, cursor?: string) =>
    apiClient
      .get<{ success: true; data: PaginatedResponse<Video> }>(`/users/${username}/videos`, {
        params: { cursor },
      })
      .then(extractData),

  getUserCalendar: (username: string) =>
    apiClient
      .get<{ success: true; data: Record<string, CalendarDay> }>(`/users/${username}/calendar`)
      .then(extractData),

  follow: (username: string) =>
    apiClient.post(`/users/${username}/follow`),

  unfollow: (username: string) =>
    apiClient.delete(`/users/${username}/follow`),

  getFollowers: (username: string, cursor?: string) =>
    apiClient
      .get<{ success: true; data: PaginatedResponse<User> }>(`/users/${username}/followers`, {
        params: { cursor },
      })
      .then(extractData),

  getFollowing: (username: string, cursor?: string) =>
    apiClient
      .get<{ success: true; data: PaginatedResponse<User> }>(`/users/${username}/following`, {
        params: { cursor },
      })
      .then(extractData),

  blockUser: (username: string) =>
    apiClient.post(`/users/${username}/block`),

  unblockUser: (username: string) =>
    apiClient.delete(`/users/${username}/block`),

  getBlockedUsers: () =>
    apiClient.get<{ success: true; data: User[] }>('/users/me/blocks').then(extractData),

  muteUser: (username: string) =>
    apiClient.post(`/users/${username}/mute`),

  unmuteUser: (username: string) =>
    apiClient.delete(`/users/${username}/mute`),

  getMutedUsers: () =>
    apiClient.get<{ success: true; data: User[] }>('/users/me/mutes').then(extractData),

  addFavorite: (username: string) =>
    apiClient.post(`/users/${username}/favorites`),

  removeFavorite: (username: string) =>
    apiClient.delete(`/users/${username}/favorites`),

  getFavorites: () =>
    apiClient.get<{ success: true; data: User[] }>('/users/me/favorites').then(extractData),

  addCloseFriend: (username: string) =>
    apiClient.post(`/users/${username}/close-friends`),

  removeCloseFriend: (username: string) =>
    apiClient.delete(`/users/${username}/close-friends`),

  getCloseFriends: () =>
    apiClient.get<{ success: true; data: User[] }>('/users/me/close-friends').then(extractData),

  getStreak: () =>
    apiClient.get<{ success: true; data: StreakInfo }>('/users/me/streak').then(extractData),
};
