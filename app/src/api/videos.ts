import { apiClient, extractData } from './client';
import { Video, DailyStatus } from '@/types';

interface PublishData {
  sessionId: string;
  duration: number;
  fileSize: number;
  width?: number;
  height?: number;
  description?: string;
  location?: string;
  mood?: string;
  weather?: string;
  communityIds?: string[];
  privacyMode?: string;
}

export const videosApi = {
  getTodayStatus: () =>
    apiClient.get<{ success: true; data: DailyStatus }>('/videos/today/status').then(extractData),

  initiateUpload: () =>
    apiClient
      .post<{ success: true; data: { uploadSessionId: string; storageKey: string } }>('/upload/initiate')
      .then(extractData),

  uploadChunk: (sessionId: string, chunk: FormData) =>
    apiClient.post(`/upload/${sessionId}/chunk`, chunk, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  completeUpload: (sessionId: string) =>
    apiClient.post(`/upload/${sessionId}/complete`),

  discardUpload: (sessionId: string) =>
    apiClient.delete(`/upload/${sessionId}`),

  publishVideo: (data: PublishData) =>
    apiClient
      .post<{ success: true; data: Video }>('/videos/today/publish', data)
      .then(extractData),

  getVideo: (videoId: string) =>
    apiClient.get<{ success: true; data: Video }>(`/videos/${videoId}`).then(extractData),

  updateVideoDescription: (videoId: string, description: string) =>
    apiClient
      .patch<{ success: true; data: Video }>(`/videos/${videoId}`, { description })
      .then(extractData),

  deleteVideo: (videoId: string) =>
    apiClient.delete(`/videos/${videoId}`),

  hideVideo: (videoId: string) =>
    apiClient.post(`/videos/${videoId}/hide`),

  archiveVideo: (videoId: string) =>
    apiClient.post(`/videos/${videoId}/archive`),
};
