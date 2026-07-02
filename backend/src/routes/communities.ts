import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ok, created, noContent, notFound, forbidden } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../config/prisma';
import { FEED_PAGE_SIZE } from '../utils/constants';

const router = Router();

const createSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  isPrivate: z.boolean().default(false),
});

router.get('/', optionalAuth, async (_req: Request, res: Response) => {
  const communities = await prisma.community.findMany({
    where: { isPrivate: false },
    orderBy: { memberCount: 'desc' },
    take: 50,
  });
  ok(res, communities);
});

router.post('/', requireAuth, validate(createSchema), async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const community = await prisma.community.create({
    data: {
      ...req.body,
      creatorId: r.user.id,
      members: { create: { userId: r.user.id, role: 'ADMIN' } },
      memberCount: 1,
    },
  });
  created(res, community);
});

router.get('/:slug', optionalAuth, async (req: Request, res: Response) => {
  const community = await prisma.community.findUnique({ where: { slug: req.params.slug } });
  if (!community) { notFound(res); return; }

  let isMember = false;
  if (req.user) {
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: req.user.id } },
    });
    isMember = !!member;
  }

  ok(res, { ...community, isMember });
});

router.get('/:slug/feed', optionalAuth, async (req: Request, res: Response) => {
  const { cursor } = req.query as { cursor?: string };
  const community = await prisma.community.findUnique({ where: { slug: req.params.slug } });
  if (!community) { notFound(res); return; }

  const posts = await prisma.communityPost.findMany({
    where: {
      communityId: community.id,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: FEED_PAGE_SIZE + 1,
    include: {
      video: {
        include: {
          user: { select: { id: true, username: true, name: true, profilePictureUrl: true } },
        },
      },
    },
  });

  const hasMore = posts.length > FEED_PAGE_SIZE;
  const items = hasMore ? posts.slice(0, FEED_PAGE_SIZE) : posts;
  ok(res, { items: items.map((p) => p.video), hasMore, nextCursor: hasMore ? items[items.length - 1].createdAt.toISOString() : undefined });
});

router.get('/:slug/members', optionalAuth, async (req: Request, res: Response) => {
  const community = await prisma.community.findUnique({ where: { slug: req.params.slug } });
  if (!community) { notFound(res); return; }

  const members = await prisma.communityMember.findMany({
    where: { communityId: community.id },
    include: { user: { select: { id: true, username: true, name: true, profilePictureUrl: true } } },
    orderBy: { joinedAt: 'asc' },
    take: 100,
  });

  ok(res, members.map((m) => ({ ...m.user, role: m.role, joinedAt: m.joinedAt })));
});

router.post('/:slug/join', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const community = await prisma.community.findUnique({ where: { slug: req.params.slug } });
  if (!community) { notFound(res); return; }

  await prisma.$transaction([
    prisma.communityMember.upsert({
      where: { communityId_userId: { communityId: community.id, userId: r.user.id } },
      create: { communityId: community.id, userId: r.user.id, role: 'MEMBER' },
      update: {},
    }),
    prisma.community.update({
      where: { id: community.id },
      data: { memberCount: { increment: 1 } },
    }),
  ]);

  ok(res, { joined: true });
});

router.delete('/:slug/leave', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const community = await prisma.community.findUnique({ where: { slug: req.params.slug } });
  if (!community) { notFound(res); return; }

  const member = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId: r.user.id } },
  });
  if (!member) { notFound(res); return; }
  if (member.role === 'ADMIN' && community.creatorId === r.user.id) {
    forbidden(res, 'Community creator cannot leave. Transfer ownership first.');
    return;
  }

  await prisma.$transaction([
    prisma.communityMember.delete({
      where: { communityId_userId: { communityId: community.id, userId: r.user.id } },
    }),
    prisma.community.update({
      where: { id: community.id },
      data: { memberCount: { decrement: 1 } },
    }),
  ]);

  noContent(res);
});

export default router;
