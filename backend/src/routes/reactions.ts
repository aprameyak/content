import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ok, noContent, notFound } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../config/prisma';

const router = Router();

const reactionSchema = z.object({
  type: z.enum(['HEART', 'CLAP', 'FIRE', 'SMILE', 'CRY', 'MUSCLE']),
});

const EMOJI_MAP: Record<string, string> = {
  HEART: '❤️', CLAP: '👏', FIRE: '🔥', SMILE: '😊', CRY: '😭', MUSCLE: '💪',
};

router.get('/videos/:videoId', optionalAuth, async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const reactions = await prisma.reaction.groupBy({
    by: ['type'],
    where: { videoId },
    _count: { type: true },
  });

  const counts: Record<string, number> = { HEART: 0, CLAP: 0, FIRE: 0, SMILE: 0, CRY: 0, MUSCLE: 0 };
  for (const r of reactions) counts[r.type] = r._count.type;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  let userReaction = null;
  if (req.user) {
    const existing = await prisma.reaction.findUnique({
      where: { videoId_userId: { videoId, userId: req.user.id } },
    });
    userReaction = existing?.type ?? null;
  }

  ok(res, { counts: { ...counts, total }, userReaction });
});

router.post('/videos/:videoId', requireAuth, validate(reactionSchema), async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const { videoId } = req.params;

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) { notFound(res); return; }

  const reaction = await prisma.reaction.upsert({
    where: { videoId_userId: { videoId, userId: r.user.id } },
    create: { videoId, userId: r.user.id, type: req.body.type },
    update: { type: req.body.type },
  });

  // Notify video author (don't notify yourself)
  if (video.userId !== r.user.id) {
    await prisma.notification.upsert({
      where: {
        // Use a compound key approximation — create unique enough check
        id: `reaction-${videoId}-${r.user.id}`,
      },
      create: {
        id: `reaction-${videoId}-${r.user.id}`,
        recipientId: video.userId,
        senderId: r.user.id,
        type: 'REACTION',
        title: 'New reaction',
        body: `Someone reacted ${EMOJI_MAP[req.body.type]} to your memory`,
        data: { videoId },
      },
      update: {
        body: `Someone reacted ${EMOJI_MAP[req.body.type]} to your memory`,
        isRead: false,
        createdAt: new Date(),
      },
    });
  }

  ok(res, reaction);
});

router.delete('/videos/:videoId', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  await prisma.reaction.deleteMany({
    where: { videoId: req.params.videoId, userId: r.user.id },
  });
  noContent(res);
});

export default router;
