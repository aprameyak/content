import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { getUserCurrentDate } from '../utils/timezone';
import { computeNextMilestone } from '../utils/streak';
import { StreakInfo } from '../types';
import { STREAK_MILESTONES } from '../utils/constants';

export type UserPublic = {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  profilePictureUrl: string | null;
  privacyMode: string;
  isVerified: boolean;
  currentStreak: number;
  longestStreak: number;
  totalPostsDays: number;
  createdAt: Date;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  isFollowRequested?: boolean;
  isBlocked?: boolean;
  isMuted?: boolean;
};

function selectPublicUser(viewerId?: string) {
  return {
    id: true,
    username: true,
    name: true,
    bio: true,
    profilePictureUrl: true,
    privacyMode: true,
    isVerified: true,
    currentStreak: true,
    longestStreak: true,
    totalPostsDays: true,
    createdAt: true,
    _count: { select: { followers: true, following: true } },
  } as const;
}

export async function getUserByUsername(username: string, viewerId?: string): Promise<UserPublic> {
  const user = await prisma.user.findFirst({
    where: { username: username.toLowerCase(), isActive: true, deletedAt: null },
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      profilePictureUrl: true,
      privacyMode: true,
      isVerified: true,
      currentStreak: true,
      longestStreak: true,
      totalPostsDays: true,
      createdAt: true,
      _count: { select: { followers: true, following: true } },
    },
  });

  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

  // Check if viewer blocked by this user
  if (viewerId) {
    const blocked = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: viewerId } },
    });
    if (blocked) throw new AppError(404, 'NOT_FOUND', 'User not found');
  }

  let isFollowing = false;
  let isFollowRequested = false;
  let isBlocked = false;
  let isMuted = false;

  if (viewerId) {
    const [follow, block, mute] = await Promise.all([
      prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
      }),
      prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: viewerId, blockedId: user.id } },
      }),
      prisma.mute.findUnique({
        where: { muterId_mutedId: { muterId: viewerId, mutedId: user.id } },
      }),
    ]);

    isFollowing = follow?.status === 'ACCEPTED';
    isFollowRequested = follow?.status === 'PENDING';
    isBlocked = !!block;
    isMuted = !!mute;
  }

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    bio: user.bio,
    profilePictureUrl: user.profilePictureUrl,
    privacyMode: user.privacyMode,
    isVerified: user.isVerified,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    totalPostsDays: user.totalPostsDays,
    createdAt: user.createdAt,
    followersCount: user._count.followers,
    followingCount: user._count.following,
    isFollowing,
    isFollowRequested,
    isBlocked,
    isMuted,
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      bio: true,
      profilePictureUrl: true,
      birthday: true,
      timezone: true,
      privacyMode: true,
      isVerified: true,
      twoFactorEnabled: true,
      currentStreak: true,
      longestStreak: true,
      totalPostsDays: true,
      lastPostedDate: true,
      notifyFriendPosted: true,
      notifyComments: true,
      notifyReactions: true,
      notifyFollowers: true,
      notifyDailyReminder: true,
      notifyStreakReminder: true,
      createdAt: true,
      _count: { select: { followers: true, following: true } },
    },
  });
  return user;
}

export async function updateMe(userId: string, data: {
  name?: string;
  bio?: string;
  profilePictureUrl?: string;
  timezone?: string;
  privacyMode?: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE' | 'CLOSE_FRIENDS_ONLY';
  notifyFriendPosted?: boolean;
  notifyComments?: boolean;
  notifyReactions?: boolean;
  notifyFollowers?: boolean;
  notifyDailyReminder?: boolean;
  notifyStreakReminder?: boolean;
}) {
  return prisma.user.update({ where: { id: userId }, data });
}

export async function followUser(followerId: string, targetUsername: string): Promise<{ status: string }> {
  const target = await prisma.user.findFirst({
    where: { username: targetUsername.toLowerCase(), isActive: true, deletedAt: null },
  });
  if (!target) throw new AppError(404, 'NOT_FOUND', 'User not found');
  if (target.id === followerId) throw new AppError(400, 'BAD_REQUEST', 'Cannot follow yourself');

  // Check block
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: followerId, blockedId: target.id },
        { blockerId: target.id, blockedId: followerId },
      ],
    },
  });
  if (block) throw new AppError(403, 'FORBIDDEN', 'Cannot follow this user');

  const status = target.privacyMode === 'PUBLIC' || target.privacyMode === 'FOLLOWERS_ONLY'
    ? 'ACCEPTED'
    : 'PENDING';

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId: target.id } },
    create: { followerId, followingId: target.id, status },
    update: { status },
  });

  // Notify
  if (status === 'ACCEPTED') {
    await prisma.notification.create({
      data: {
        recipientId: target.id,
        senderId: followerId,
        type: 'NEW_FOLLOWER',
        title: 'New follower',
        body: 'Someone started following you',
      },
    });
  } else {
    await prisma.notification.create({
      data: {
        recipientId: target.id,
        senderId: followerId,
        type: 'FOLLOW_REQUEST',
        title: 'Follow request',
        body: 'Someone wants to follow you',
      },
    });
  }

  return { status };
}

export async function unfollowUser(followerId: string, targetUsername: string): Promise<void> {
  const target = await prisma.user.findFirst({ where: { username: targetUsername.toLowerCase() } });
  if (!target) return;
  await prisma.follow.deleteMany({
    where: { followerId, followingId: target.id },
  });
}

export async function blockUser(blockerId: string, targetUsername: string): Promise<void> {
  const target = await prisma.user.findFirst({ where: { username: targetUsername.toLowerCase() } });
  if (!target) throw new AppError(404, 'NOT_FOUND', 'User not found');
  if (target.id === blockerId) throw new AppError(400, 'BAD_REQUEST', 'Cannot block yourself');

  await prisma.$transaction([
    prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId: target.id } },
      create: { blockerId, blockedId: target.id },
      update: {},
    }),
    // Remove any follows
    prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: target.id },
          { followerId: target.id, followingId: blockerId },
        ],
      },
    }),
  ]);
}

export async function unblockUser(blockerId: string, targetUsername: string): Promise<void> {
  const target = await prisma.user.findFirst({ where: { username: targetUsername.toLowerCase() } });
  if (!target) return;
  await prisma.block.deleteMany({ where: { blockerId, blockedId: target.id } });
}

export async function muteUser(muterId: string, targetUsername: string): Promise<void> {
  const target = await prisma.user.findFirst({ where: { username: targetUsername.toLowerCase() } });
  if (!target) throw new AppError(404, 'NOT_FOUND', 'User not found');
  await prisma.mute.upsert({
    where: { muterId_mutedId: { muterId, mutedId: target.id } },
    create: { muterId, mutedId: target.id },
    update: {},
  });
}

export async function unmuteUser(muterId: string, targetUsername: string): Promise<void> {
  const target = await prisma.user.findFirst({ where: { username: targetUsername.toLowerCase() } });
  if (!target) return;
  await prisma.mute.deleteMany({ where: { muterId, mutedId: target.id } });
}

export async function getStreak(userId: string): Promise<StreakInfo> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, totalPostsDays: true, lastPostedDate: true },
  });

  return {
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    totalPostsDays: user.totalPostsDays,
    lastPostedDate: user.lastPostedDate ?? undefined,
    nextMilestone: computeNextMilestone(user.currentStreak),
  };
}

export async function getUserCalendar(
  username: string,
  viewerId?: string,
): Promise<Record<string, { videoId: string; thumbnailUrl?: string }>> {
  const user = await getUserByUsername(username, viewerId);

  // Privacy check
  if (
    user.privacyMode !== 'PUBLIC' &&
    (!viewerId || (!user.isFollowing && user.id !== viewerId))
  ) {
    return {};
  }

  const videos = await prisma.video.findMany({
    where: { userId: user.id, status: 'READY', isHidden: false, isArchived: false },
    select: { id: true, postDate: true, thumbnailKey: true },
    orderBy: { postDate: 'asc' },
  });

  const calendar: Record<string, { videoId: string; thumbnailUrl?: string }> = {};
  for (const v of videos) {
    calendar[v.postDate] = {
      videoId: v.id,
      thumbnailUrl: v.thumbnailKey
        ? `${process.env.CDN_BASE_URL}/${v.thumbnailKey}`
        : undefined,
    };
  }
  return calendar;
}

export async function deleteAccount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false, deletedAt: new Date() },
  });
}
