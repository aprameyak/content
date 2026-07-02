import { apiClient, extractData } from './client';
import { AuthTokens } from '@/types';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: string;
  birthday: string;
  timezone: string;
}

interface LoginData {
  emailOrUsername: string;
  password: string;
  deviceInfo?: {
    platform?: 'IOS' | 'ANDROID';
    appVersion?: string;
  };
}

type LoginResponse = AuthTokens | { requires2FA: true; tempToken: string };

export const authApi = {
  register: (data: RegisterData) =>
    apiClient.post<{ success: true; data: AuthTokens }>('/auth/register', data).then(extractData),

  login: (data: LoginData) =>
    apiClient.post<{ success: true; data: LoginResponse }>('/auth/login', data).then(extractData),

  login2FA: (tempToken: string, code: string) =>
    apiClient
      .post<{ success: true; data: AuthTokens }>('/auth/login/2fa', { tempToken, code })
      .then(extractData),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),

  refresh: (refreshToken: string) =>
    apiClient
      .post<{ success: true; data: { accessToken: string; refreshToken: string } }>('/auth/refresh', { refreshToken })
      .then(extractData),

  setup2FA: () =>
    apiClient
      .post<{ success: true; data: { secret: string; qrCodeUri: string } }>('/auth/2fa/setup')
      .then(extractData),

  verify2FA: (code: string) =>
    apiClient.post('/auth/2fa/verify', { code }),

  disable2FA: (code: string) =>
    apiClient.delete('/auth/2fa', { data: { code } }),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { token, newPassword }),
};
