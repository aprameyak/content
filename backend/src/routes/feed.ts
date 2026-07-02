import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { ok } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../config/prisma';
import { FEED_PAGE_SIZE, FEED_DAYS_LOOKBACK } from '../utils/constants';

const router = Router();

function getLookbackDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() - FEED_DAYS_LOOKBACK);
  return d;
}

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const { cursor, sort } = req.query as { cursor?: string; sort?: string };
  const limit = FEED_PAGE_SIZE;

  // Get followed user IDs
  const follows = await prisma.follow.findMany({
    where: { followerId: r.user.id, status: 'ACCEPTED' },
    select: { followingId: true },
  });
  const followedIds = follows.map((f) => f.followingId);

  // Get muted user IDs
  const mutes = await prisma.mute.findMany({
    where: { muterId: r.user.id },
    select: { mutedId: true },
  });
  const mutedIds = new Set(mutes.map((m) => m.mutedId));

  const visibleIds = followedIds.filter((id) => !mutedIds.has(id));

  let orderBy: object = { createdAt: 'desc' };
  if (sort === 'close-friends-first') {
    // We'll sort in memory after fetching, or use a more complex query
    // For simplicity, fetch and sort by whether author is a close friend
    orderBy = { createdAt: 'desc' };
  }

  const videos = await prisma.video.findMany({
    where: {
      userId: { in: visibleIds },
      status: 'READY',
      isHidden: false,
      isArchived: false,
      createdAt: {
        gte: getLookbackDate(),
        ...(cursor ? { lt: new Date(cursor) } : {}),
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    include: {
      user: { select: { id: true, username: true, name: true, profilePictureUrl: true } },
      _count: { select: { comments: { where: { isDeleted: false } }, reactions: true } },
    },
  });

  const hasMore = videos.length > limit;
  const items = hasMore ? videos.slice(0, limit) : videos;

  // If close-friends-first, reorder
  if (sort === 'close-friends-first') {
    const closeFriends = await prisma.closeFriend.findMany({
      where: { ownerId: r.user.id },
      select: { targetId: true },
    });
    const cfSet = new Set(closeFriends.map((cf) => cf.targetId));
    items.sort((a, b) => {
      const aCF = cfSet.has(a.userId) ? 0 : 1;
      const bCF = cfSet.has(b.userId) ? 0 : 1;
      if (aCF !== bCF) return aCF - bCF;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  ok(res, {
    items,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1].createdAt.toISOString() : undefined,
  });
});

router.get('/date/:date', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const { date } = req.params;

  const follows = await prisma.follow.findMany({
    where: { followerId: r.user.id, status: 'ACCEPTED' },
    select: { followingId: true },
  });
  const followedIds = follows.map((f) => f.followingId);

  const videos = await prisma.video.findMany({
    where: {
      userId: { in: followedIds },
      postDate: date,
      status: 'READY',
      isHidden: false,
    },
    include: {
      user: { select: { id: true, username: true, name: true, profilePictureUrl: true } },
      _count: { select: { comments: { where: { isDeleted: false } }, reactions: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  ok(res, { items: videos });
});

export default router;
