import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '@/types';
import { usersApi } from '@/api/users';

interface AuthState {
  user: (User & { email: string }) | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: User & { email: string }) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  setTokens: async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: true });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      const { refreshToken } = get();
      if (refreshToken) {
        const { authApi } = await import('@/api/auth');
        await authApi.logout(refreshToken).catch(() => {});
      }
    } finally {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    }
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const [accessToken, refreshToken] = await Promise.all([
        SecureStore.getItemAsync('accessToken'),
        SecureStore.getItemAsync('refreshToken'),
      ]);

      if (accessToken && refreshToken) {
        set({ accessToken, refreshToken });
        try {
          const user = await usersApi.getMe();
          set({ user, isAuthenticated: true });
        } catch {
          // Token invalid — clear
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
          set({ accessToken: null, refreshToken: null, isAuthenticated: false });
        }
      }
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  refreshUser: async () => {
    const user = await usersApi.getMe();
    set({ user });
  },
}));
