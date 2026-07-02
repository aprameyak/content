export * from './colors';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export const MIN_VIDEO_DURATION = 15; // seconds
export const MAX_VIDEO_DURATION = 100; // seconds
export const MAX_DESCRIPTION_LENGTH = 200;
export const MAX_BIO_LENGTH = 160;
export const FEED_PAGE_SIZE = 20;
export const CHUNK_SIZE = 1024 * 1024; // 1MB per chunk

export const REACTIONS = ['❤️', '👏', '🔥', '😊', '😭', '💪'] as const;
export const REACTION_TYPES = ['HEART', 'CLAP', 'FIRE', 'SMILE', 'CRY', 'MUSCLE'] as const;

export const MOODS = [
  'Grateful',
  'Calm',
  'Motivated',
  'Excited',
  'Tired',
  'Anxious',
  'Good',
  'Sad',
  'Okay',
  'Great',
] as const;

export const STREAK_MILESTONES = [7, 30, 100, 365, 1000] as const;

export const TIMEZONES = [
  { label: 'Pacific Time (US)', value: 'America/Los_Angeles' },
  { label: 'Mountain Time (US)', value: 'America/Denver' },
  { label: 'Central Time (US)', value: 'America/Chicago' },
  { label: 'Eastern Time (US)', value: 'America/New_York' },
  { label: 'London', value: 'Europe/London' },
  { label: 'Paris / Berlin', value: 'Europe/Paris' },
  { label: 'Moscow', value: 'Europe/Moscow' },
  { label: 'Dubai', value: 'Asia/Dubai' },
  { label: 'Mumbai', value: 'Asia/Kolkata' },
  { label: 'Singapore / KL', value: 'Asia/Singapore' },
  { label: 'Tokyo / Seoul', value: 'Asia/Tokyo' },
  { label: 'Sydney', value: 'Australia/Sydney' },
  { label: 'New Zealand', value: 'Pacific/Auckland' },
  { label: 'UTC', value: 'UTC' },
];
