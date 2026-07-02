export interface User {
  id: string;
  username: string;
  name: string;
  bio?: string | null;
  profilePictureUrl?: string | null;
  birthday?: string;
  timezone: string;
  privacyMode: PrivacyMode;
  isVerified: boolean;
  twoFactorEnabled?: boolean;
  currentStreak: number;
  longestStreak: number;
  totalPostsDays: number;
  lastPostedDate?: string | null;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  isFollowRequested?: boolean;
  isBlocked?: boolean;
  isMuted?: boolean;
  // Notification preferences (own profile only)
  notifyFriendPosted?: boolean;
  notifyComments?: boolean;
  notifyReactions?: boolean;
  notifyFollowers?: boolean;
  notifyDailyReminder?: boolean;
  notifyStreakReminder?: boolean;
  createdAt: string;
}

export type PrivacyMode = 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE' | 'CLOSE_FRIENDS_ONLY';

export type VideoStatus = 'PROCESSING' | 'READY' | 'FAILED';

export interface Video {
  id: string;
  userId: string;
  user: UserMin;
  storageKey: string;
  thumbnailKey?: string | null;
  thumbnailUrl?: string | null;
  streamUrl?: string;
  duration: number;
  fileSize?: number;
  description?: string | null;
  location?: string | null;
  mood?: string | null;
  weather?: string | null;
  postDate: string; // YYYY-MM-DD
  privacyMode: PrivacyMode;
  isHidden: boolean;
  isArchived: boolean;
  viewCount: number;
  status: VideoStatus;
  canDeleteAfter: string;
  reactionCounts?: ReactionCounts;
  userReaction?: ReactionType | null;
  _count?: { comments: number; reactions: number };
  createdAt: string;
}

export interface UserMin {
  id: string;
  username: string;
  name: string;
  profilePictureUrl?: string | null;
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  user: UserMin;
  parentId?: string | null;
  body: string;
  isEdited: boolean;
  editableUntil: string;
  replies?: Comment[];
  createdAt: string;
}

export type ReactionType = 'HEART' | 'CLAP' | 'FIRE' | 'SMILE' | 'CRY' | 'MUSCLE';

export interface ReactionCounts {
  HEART: number;
  CLAP: number;
  FIRE: number;
  SMILE: number;
  CRY: number;
  MUSCLE: number;
  total: number;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isPrivate: boolean;
  memberCount: number;
  isMember?: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  sender?: UserMin | null;
  data?: Record<string, string>;
  createdAt: string;
}

export type NotificationType =
  | 'FOLLOW_REQUEST'
  | 'FOLLOW_ACCEPTED'
  | 'NEW_FOLLOWER'
  | 'FRIEND_POSTED'
  | 'COMMENT'
  | 'REPLY'
  | 'REACTION'
  | 'STREAK_REMINDER'
  | 'DAILY_REMINDER'
  | 'STREAK_MILESTONE'
  | 'SYSTEM';

export interface DailyStatus {
  canPost: boolean;
  hasPosted: boolean;
  postDate: string;
  video?: Video;
  nextPostAvailableAt?: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalPostsDays: number;
  lastPostedDate?: string;
  nextMilestone?: number;
}

export interface CalendarDay {
  videoId: string;
  thumbnailUrl?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User & { email: string };
}

// ─── Navigation Types ─────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Profile: { username: string };
  VideoPlayer: { videoId: string; postDate?: string };
  Comments: { videoId: string };
  EditProfile: undefined;
  Settings: undefined;
  PrivacySettings: undefined;
  BlockedUsers: undefined;
  MutedUsers: undefined;
  Followers: { username: string };
  Following: { username: string };
  FavoritesScreen: undefined;
  CloseFriendsScreen: undefined;
  CommunityDetail: { slug: string };
  Search: undefined;
  Notifications: undefined;
  CalendarScreen: { username: string };
  StreakScreen: undefined;
  Report: { videoId?: string; userId?: string; commentId?: string };
  TwoFactorSetup: undefined;
};

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Record: undefined;
  Communities: undefined;
  ProfileTab: undefined;
};
