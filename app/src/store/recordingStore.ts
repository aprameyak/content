import { create } from 'zustand';

export type RecordingPhase =
  | 'idle'
  | 'countdown'
  | 'recording'
  | 'preview'
  | 'details'
  | 'uploading'
  | 'published';

interface RecordingState {
  sessionId: string | null;
  storageKey: string | null;
  recordingUri: string | null;
  duration: number;
  fileSize: number;
  isUploading: boolean;
  uploadProgress: number;
  phase: RecordingPhase;
  publishedVideoId: string | null;
  error: string | null;

  startSession: (sessionId: string, storageKey: string) => void;
  setRecordingComplete: (uri: string, duration: number, fileSize?: number) => void;
  setPhase: (phase: RecordingPhase) => void;
  setUploading: (progress: number) => void;
  setPublished: (videoId: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  storageKey: null,
  recordingUri: null,
  duration: 0,
  fileSize: 0,
  isUploading: false,
  uploadProgress: 0,
  phase: 'idle' as RecordingPhase,
  publishedVideoId: null,
  error: null,
};

export const useRecordingStore = create<RecordingState>((set) => ({
  ...initialState,

  startSession: (sessionId, storageKey) =>
    set({ sessionId, storageKey }),

  setRecordingComplete: (uri, duration, fileSize = 0) =>
    set({ recordingUri: uri, duration, fileSize, phase: 'preview' }),

  setPhase: (phase) => set({ phase }),

  setUploading: (progress) =>
    set({ isUploading: true, uploadProgress: progress, phase: 'uploading' }),

  setPublished: (videoId) =>
    set({ isUploading: false, phase: 'published', publishedVideoId: videoId }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
