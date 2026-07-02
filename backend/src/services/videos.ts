import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { getUserCurrentDate } from '../utils/timezone';
import { updateUserStreak } from '../utils/streak';
import { getStorage, generateVideoKey, generateThumbnailKey } from '../utils/storage';
import {
  MIN_VIDEO_DURATION,
  MAX_VIDEO_DURATION,
  VIDEO_DELETE_LOCK_HOURS,
  UPLOAD_SESSION_EXPIRY_HOURS,
} from '../utils/constants';
import { logger } from '../utils/logger';

export interface DailyStatus {
  canPost: boolean;
  hasPosted: boolean;
  postDate: string;
  video?: object;
  nextPostAvailableAt?: string;
}

export async function getDailyStatus(userId: string): Promise<DailyStatus> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { timezone: true },
  });
  const today = getUserCurrentDate(user.timezone);

  const video = await prisma.video.findUnique({
    where: { userId_postDate: { userId, postDate: today } },
    include: { user: { select: { id: true, username: true, name: true, profilePictureUrl: true } } },
  });

  if (video) {
    // Calculate when they can post again (midnight in their timezone)
    const tomorrow = new Date(today + 'T00:00:00Z');
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return {
      canPost: false,
      hasPosted: true,
      postDate: today,
      video,
      nextPostAvailableAt: tomorrow.toISOString(),
    };
  }

  return { canPost: true, hasPosted: false, postDate: today };
}

export async function initiateUpload(userId: string): Promise<{
  uploadSessionId: string;
  storageKey: string;
}> {
  const status = await getDailyStatus(userId);
  if (!status.canPost) {
    throw new AppError(409, 'ALREADY_POSTED', 'You have already posted today');
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { timezone: true } });
  const today = getUserCurrentDate(user.timezone);
  const storageKey = generateVideoKey(userId, today);

  const session = await prisma.uploadSession.create({
    data: {
      userId,
      storageKey,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + UPLOAD_SESSION_EXPIRY_HOURS * 60 * 60 * 1000),
    },
  });

  return { uploadSessionId: session.id, storageKey };
}

export async function appendChunk(
  sessionId: string,
  userId: string,
  chunk: Buffer,
): Promise<void> {
  const session = await prisma.uploadSession.findFirst({
    where: { id: sessionId, userId, status: { in: ['PENDING', 'UPLOADING'] } },
  });
  if (!session) throw new AppError(404, 'NOT_FOUND', 'Upload session not found');
  if (session.expiresAt < new Date()) throw new AppError(410, 'EXPIRED', 'Upload session expired');

  const storage = getStorage();
  await storage.appendChunk(session.storageKey, chunk);

  await prisma.uploadSession.update({
    where: { id: sessionId },
    data: {
      status: 'UPLOADING',
      uploadedBytes: { increment: chunk.length },
    },
  });
}

export async function completeUpload(sessionId: string, userId: string): Promise<void> {
  const session = await prisma.uploadSession.findFirst({
    where: { id: sessionId, userId, status: 'UPLOADING' },
  });
  if (!session) throw new AppError(404, 'NOT_FOUND', 'Upload session not found');

  await prisma.uploadSession.update({
    where: { id: sessionId },
    data: { status: 'COMPLETE' },
  });
}

export interface PublishInput {
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
  privacyMode?: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE' | 'CLOSE_FRIENDS_ONLY';
}

export async function publishVideo(userId: string, input: PublishInput) {
  if (input.duration < MIN_VIDEO_DURATION) {
    throw new AppError(422, 'TOO_SHORT', `Video must be at least ${MIN_VIDEO_DURATION} seconds`);
  }
  if (input.duration > MAX_VIDEO_DURATION) {
    throw new AppError(422, 'TOO_LONG', `Video must be at most ${MAX_VIDEO_DURATION} seconds`);
  }

  const status = await getDailyStatus(userId);
  if (!status.canPost) {
    throw new AppError(409, 'ALREADY_POSTED', 'You have already posted today');
  }

  const session = await prisma.uploadSession.findFirst({
    where: { id: input.sessionId, userId, status: 'COMPLETE' },
  });
  if (!session) throw new AppError(404, 'NOT_FOUND', 'Upload session not found or not complete');

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { timezone: true } });
  const today = getUserCurrentDate(user.timezone);

  const video = await prisma.video.create({
    data: {
      userId,
      storageKey: session.storageKey,
      thumbnailKey: generateThumbnailKey(session.storageKey),
      duration: input.duration,
      fileSize: input.fileSize,
      width: input.width,
      height: input.height,
      description: input.description,
      location: input.location,
      mood: input.mood,
      weather: input.weather,
      postDate: today,
      privacyMode: input.privacyMode ?? 'PUBLIC',
      status: 'READY',
      canDeleteAfter: new Date(Date.now() + VIDEO_DELETE_LOCK_HOURS * 60 * 60 * 1000),
      communityPosts: input.communityIds?.length
        ? {
            create: input.communityIds.map((communityId) => ({ communityId })),
          }
        : undefined,
    },
    include: { user: { select: { id: true, username: true, name: true, profilePictureUrl: true } } },
  });

  // Mark upload session used
  await prisma.uploadSession.update({ where: { id: session.id }, data: { status: 'COMPLETE' } });

  // Update streak
  const streakResult = await updateUserStreak(userId);

  // Notify followers
  const followers = await prisma.follow.findMany({
    where: { followingId: userId, status: 'ACCEPTED' },
    select: { followerId: true },
  });

  if (followers.length > 0) {
    await prisma.notification.createMany({
      data: followers.map((f) => ({
        recipientId: f.followerId,
        senderId: userId,
        type: 'FRIEND_POSTED' as const,
        title: 'New memory',
        body: 'Someone you follow just shared their day',
        data: { videoId: video.id },
      })),
    });
  }

  // Milestone notification
  if (streakResult.isNewMilestone && streakResult.milestone) {
    await prisma.notification.create({
      data: {
        recipientId: userId,
        type: 'STREAK_MILESTONE',
        title: `${streakResult.milestone}-day streak!`,
        body: `You've posted ${streakResult.milestone} days in a row. Keep going.`,
      },
    });
  }

  logger.info('Video published', { videoId: video.id, userId, postDate: today });
  return video;
}

export async function getVideo(videoId: string, viewerId?: string) {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      user: { select: { id: true, username: true, name: true, profilePictureUrl: true } },
      _count: { select: { comments: { where: { isDeleted: false } }, reactions: true } },
    },
  });

  if (!video || video.isHidden) throw new AppError(404, 'NOT_FOUND', 'Video not found');

  // Privacy check
  if (viewerId !== video.userId) {
    if (video.privacyMode === 'PRIVATE') throw new AppError(403, 'FORBIDDEN', 'This video is private');
    if (video.privacyMode === 'FOLLOWERS_ONLY') {
      if (!viewerId) throw new AppError(401, 'UNAUTHORIZED', 'Login required');
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: video.userId } },
      });
      if (!follow || follow.status !== 'ACCEPTED') throw new AppError(403, 'FORBIDDEN', 'Follow this user to see their videos');
    }
  }

  // Increment view count
  if (viewerId && viewerId !== video.userId) {
    await prisma.video.update({ where: { id: videoId }, data: { viewCount: { increment: 1 } } });
  }

  return video;
}

export async function deleteVideo(videoId: string, userId: string): Promise<void> {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video || video.userId !== userId) throw new AppError(404, 'NOT_FOUND', 'Video not found');
  if (video.canDeleteAfter > new Date()) {
    throw new AppError(403, 'FORBIDDEN', 'Videos cannot be deleted within 24 hours of posting');
  }
  const storage = getStorage();
  await storage.deleteFile(video.storageKey);
  if (video.thumbnailKey) await storage.deleteFile(video.thumbnailKey);
  await prisma.video.delete({ where: { id: videoId } });
}

export async function discardUpload(sessionId: string, userId: string): Promise<void> {
  const session = await prisma.uploadSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) return;
  const storage = getStorage();
  const exists = await storage.fileExists(session.storageKey);
  if (exists) await storage.deleteFile(session.storageKey);
  await prisma.uploadSession.update({ where: { id: session.id }, data: { status: 'FAILED' } });
}
