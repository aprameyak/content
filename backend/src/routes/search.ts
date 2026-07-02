import { Router, Request, Response } from 'express';
import { optionalAuth } from '../middleware/auth';
import { ok, badRequest } from '../utils/response';
import { prisma } from '../config/prisma';
import { SEARCH_LIMIT } from '../utils/constants';

const router = Router();

router.get('/users', optionalAuth, async (req: Request, res: Response) => {
  const { q } = req.query as { q?: string };
  if (!q || q.trim().length < 1) { badRequest(res, 'Query required'); return; }

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      OR: [
        { username: { contains: q.toLowerCase(), mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, username: true, name: true, profilePictureUrl: true, isVerified: true, privacyMode: true },
    take: SEARCH_LIMIT,
  });

  ok(res, users);
});

router.get('/communities', optionalAuth, async (req: Request, res: Response) => {
  const { q } = req.query as { q?: string };
  if (!q || q.trim().length < 1) { badRequest(res, 'Query required'); return; }

  const communities = await prisma.community.findMany({
    where: {
      isPrivate: false,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    },
    take: SEARCH_LIMIT,
  });

  ok(res, communities);
});

router.get('/locations', optionalAuth, async (req: Request, res: Response) => {
  const { q } = req.query as { q?: string };
  if (!q || q.trim().length < 1) { badRequest(res, 'Query required'); return; }

  const locations = await prisma.video.findMany({
    where: {
      location: { contains: q, mode: 'insensitive' },
      status: 'READY',
      isHidden: false,
    },
    select: { location: true },
    distinct: ['location'],
    take: SEARCH_LIMIT,
  });

  ok(res, locations.map((v) => v.location).filter(Boolean));
});

export default router;
