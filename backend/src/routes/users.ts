import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as usersService from '../services/users';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ok, noContent } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../config/prisma';
import { FEED_PAGE_SIZE } from '../utils/constants';
import { getStorage } from '../utils/storage';

const router = Router();

const updateMeSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  bio: z.string().max(160).optional(),
  profilePictureUrl: z.string().url().optional(),
  timezone: z.string().optional(),
  privacyMode: z.enum(['PUBLIC', 'FOLLOWERS_ONLY', 'PRIVATE', 'CLOSE_FRIENDS_ONLY']).optional(),
  notifyFriendPosted: z.boolean().optional(),
  notifyComments: z.boolean().optional(),
  notifyReactions: z.boolean().optional(),
  notifyFollowers: z.boolean().optional(),
  notifyDailyReminder: z.boolean().optional(),
  notifyStreakReminder: z.boolean().optional(),
});

// Current user
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const user = await usersService.getMe(r.user.id);
  ok(res, user);
});

router.patch('/me', requireAuth, validate(updateMeSchema), async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const updated = await usersService.updateMe(r.user.id, req.body);
  ok(res, updated);
});

router.delete('/me', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  await usersService.deleteAccount(r.user.id);
  noContent(res);
});

router.get('/me/streak', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const streak = await usersService.getStreak(r.user.id);
  ok(res, streak);
});

router.get('/me/blocks', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const blocks = await prisma.block.findMany({
    where: { blockerId: r.user.id },
    include: { blocked: { select: { id: true, username: true, name: true, profilePictureUrl: true } } },
  });
  ok(res, blocks.map((b) => b.blocked));
});

router.get('/me/mutes', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const mutes = await prisma.mute.findMany({
    where: { muterId: r.user.id },
    include: { muted: { select: { id: true, username: true, name: true, profilePictureUrl: true } } },
  });
  ok(res, mutes.map((m) => m.muted));
});

router.get('/me/close-friends', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const cfs = await prisma.closeFriend.findMany({
    where: { ownerId: r.user.id },
    include: { target: { select: { id: true, username: true, name: true, profilePictureUrl: true } } },
  });
  ok(res, cfs.map((cf) => cf.target));
});

router.get('/me/favorites', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const favs = await prisma.favorite.findMany({
    where: { ownerId: r.user.id },
    include: { target: { select: { id: true, username: true, name: true, profilePictureUrl: true } } },
  });
  ok(res, favs.map((f) => f.target));
});

// Public user routes
router.get('/:username', optionalAuth, async (req: Request, res: Response) => {
  const user = await usersService.getUserByUsername(req.params.username, req.user?.id);
  ok(res, user);
});

router.get('/:username/calendar', optionalAuth, async (req: Request, res: Response) => {
  const calendar = await usersService.getUserCalendar(req.params.username, req.user?.id);
  ok(res, calendar);
});

router.get('/:username/videos', optionalAuth, async (req: Request, res: Response) => {
  const { cursor, limit } = req.query as { cursor?: string; limit?: string };
  const pageSize = Math.min(Number(limit) || FEED_PAGE_SIZE, 50);
  const targetUser = await usersService.getUserByUsername(req.params.username, req.user?.id);

  const videos = await prisma.video.findMany({
    where: {
      userId: targetUser.id,
      status: 'READY',
      isHidden: false,
      isArchived: false,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: pageSize + 1,
    include: { user: { select: { id: true, username: true, name: true, profilePictureUrl: true } } },
  });

  const hasMore = videos.length > pageSize;
  const items = hasMore ? videos.slice(0, pageSize) : videos;
  ok(res, { items, hasMore, nextCursor: hasMore ? items[items.length - 1].createdAt.toISOString() : undefined });
});

// Follow
router.post('/:username/follow', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const result = await usersService.followUser(r.user.id, req.params.username);
  ok(res, result);
});

router.delete('/:username/follow', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  await usersService.unfollowUser(r.user.id, req.params.username);
  noContent(res);
});

router.get('/:username/followers', optionalAuth, async (req: Request, res: Response) => {
  const { cursor } = req.query as { cursor?: string };
  const target = await usersService.getUserByUsername(req.params.username, req.user?.id);
  const followers = await prisma.follow.findMany({
    where: { followingId: target.id, status: 'ACCEPTED' },
    include: { follower: { select: { id: true, username: true, name: true, profilePictureUrl: true } } },
    take: FEED_PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = followers.length > FEED_PAGE_SIZE;
  const items = hasMore ? followers.slice(0, FEED_PAGE_SIZE) : followers;
  ok(res, { items: items.map((f) => f.follower), hasMore, nextCursor: hasMore ? items[items.length - 1].id : undefined });
});

router.get('/:username/following', optionalAuth, async (req: Request, res: Response) => {
  const { cursor } = req.query as { cursor?: string };
  const target = await usersService.getUserByUsername(req.params.username, req.user?.id);
  const following = await prisma.follow.findMany({
    where: { followerId: target.id, status: 'ACCEPTED' },
    include: { following: { select: { id: true, username: true, name: true, profilePictureUrl: true } } },
    take: FEED_PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = following.length > FEED_PAGE_SIZE;
  const items = hasMore ? following.slice(0, FEED_PAGE_SIZE) : following;
  ok(res, { items: items.map((f) => f.following), hasMore, nextCursor: hasMore ? items[items.length - 1].id : undefined });
});

// Block / Mute
router.post('/:username/block', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  await usersService.blockUser(r.user.id, req.params.username);
  ok(res, { blocked: true });
});

router.delete('/:username/block', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  await usersService.unblockUser(r.user.id, req.params.username);
  noContent(res);
});

router.post('/:username/mute', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  await usersService.muteUser(r.user.id, req.params.username);
  ok(res, { muted: true });
});

router.delete('/:username/mute', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  await usersService.unmuteUser(r.user.id, req.params.username);
  noContent(res);
});

// Close friends / Favorites
router.post('/:username/close-friends', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const target = await usersService.getUserByUsername(req.params.username);
  await prisma.closeFriend.upsert({
    where: { ownerId_targetId: { ownerId: r.user.id, targetId: target.id } },
    create: { ownerId: r.user.id, targetId: target.id },
    update: {},
  });
  ok(res, { added: true });
});

router.delete('/:username/close-friends', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const target = await usersService.getUserByUsername(req.params.username);
  await prisma.closeFriend.deleteMany({ where: { ownerId: r.user.id, targetId: target.id } });
  noContent(res);
});

router.post('/:username/favorites', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const target = await usersService.getUserByUsername(req.params.username);
  await prisma.favorite.upsert({
    where: { ownerId_targetId: { ownerId: r.user.id, targetId: target.id } },
    create: { ownerId: r.user.id, targetId: target.id },
    update: {},
  });
  ok(res, { added: true });
});

router.delete('/:username/favorites', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const target = await usersService.getUserByUsername(req.params.username);
  await prisma.favorite.deleteMany({ where: { ownerId: r.user.id, targetId: target.id } });
  noContent(res);
});

export default router;
