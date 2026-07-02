import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth } from './useAuth';
import { useNotificationStore } from '@/store/notificationStore';
import { notificationsApi } from '@/api/notifications';
import { apiClient } from '@/api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (!isAuthenticated) return;

    registerForPushNotifications();
    fetchUnreadCount();

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      fetchUnreadCount();
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((_response) => {
      // Navigate based on notification data — handled in navigation
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated]);

  async function registerForPushNotifications() {
    if (Platform.OS === 'web') return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    try {
      const token = await Notifications.getExpoPushTokenAsync();
      // Register token with backend
      await apiClient.post('/users/me/device', {
        fcmToken: token.data,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      }).catch(() => {});
    } catch {
      // Non-critical
    }
  }

  async function fetchUnreadCount() {
    try {
      const { count } = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Non-critical
    }
  }
}
