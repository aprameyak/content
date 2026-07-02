import { Request } from 'express';

// ─── Augment Express ──────────────────────────────────────────────────────────

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  twoFactorEnabled: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

// ─── JWT Payloads ─────────────────────────────────────────────────────────────

export interface JwtAccessPayload {
  sub: string; // userId
  username: string;
  email: string;
  twoFactorEnabled: boolean;
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: string;
  sessionId: string;
  type: 'refresh';
}

export interface JwtTempPayload {
  sub: string;
  type: 'temp_2fa';
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export interface DailyStatus {
  canPost: boolean;
  hasPosted: boolean;
  postDate: string;
  nextPostAvailableAt?: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalPostsDays: number;
  lastPostedDate?: string;
  nextMilestone?: number;
}
