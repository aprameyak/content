import { apiClient, extractData } from './client';
import { Notification, PaginatedResponse } from '@/types';

export const notificationsApi = {
  getNotifications: (cursor?: string) =>
    apiClient
      .get<{ success: true; data: PaginatedResponse<Notification> }>('/notifications', {
        params: { cursor },
      })
      .then(extractData),

  markRead: (notificationId: string) =>
    apiClient.patch(`/notifications/${notificationId}/read`),

  markAllRead: () =>
    apiClient.post('/notifications/read-all'),

  getUnreadCount: () =>
    apiClient
      .get<{ success: true; data: { count: number } }>('/notifications/unread-count')
      .then(extractData),
};
