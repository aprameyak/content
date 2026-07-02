import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ok, noContent, forbidden, notFound } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../config/prisma';
import { COMMENT_EDIT_WINDOW_MS, COMMENT_PAGE_SIZE } from '../utils/constants';

const router = Router({ mergeParams: true });

const createSchema = z.object({
  body: z.string().min(1).max(500),
  parentId: z.string().optional(),
});

const editSchema = z.object({
  body: z.string().min(1).max(500),
});

router.get('/videos/:videoId/comments', optionalAuth, async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const { cursor } = req.query as { cursor?: string };

  const comments = await prisma.comment.findMany({
    where: {
      videoId,
      parentId: null,
      isDeleted: false,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    take: COMMENT_PAGE_SIZE + 1,
    include: {
      user: { select: { id: true, username: true, name: true, profilePictureUrl: true } },
      replies: {
        where: { isDeleted: false },
        include: { user: { select: { id: true, username: true, name: true, profilePictureUrl: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  const hasMore = comments.length > COMMENT_PAGE_SIZE;
  const items = hasMore ? comments.slice(0, COMMENT_PAGE_SIZE) : comments;

  ok(res, { items, hasMore, nextCursor: hasMore ? items[items.length - 1].createdAt.toISOString() : undefined });
});

router.post('/videos/:videoId/comments', requireAuth, validate(createSchema), async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const { videoId } = req.params;

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) { notFound(res); return; }

  const comment = await prisma.comment.create({
    data: {
      videoId,
      userId: r.user.id,
      body: req.body.body,
      parentId: req.body.parentId ?? null,
      editableUntil: new Date(Date.now() + COMMENT_EDIT_WINDOW_MS),
    },
    include: { user: { select: { id: true, username: true, name: true, profilePictureUrl: true } } },
  });

  // Notify video author
  if (video.userId !== r.user.id) {
    const notifType = req.body.parentId ? 'REPLY' : 'COMMENT';
    await prisma.notification.create({
      data: {
        recipientId: video.userId,
        senderId: r.user.id,
        type: notifType,
        title: notifType === 'COMMENT' ? 'New comment' : 'New reply',
        body: `"${req.body.body.slice(0, 50)}"`,
        data: { videoId, commentId: comment.id },
      },
    });
  }

  ok(res, comment, undefined, 201);
});

router.patch('/:id', requireAuth, validate(editSchema), async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
  if (!comment || comment.isDeleted) { notFound(res); return; }
  if (comment.userId !== r.user.id) { forbidden(res); return; }
  if (comment.editableUntil < new Date()) {
    forbidden(res, 'Comment is no longer editable (5-minute window has passed)');
    return;
  }
  const updated = await prisma.comment.update({
    where: { id: req.params.id },
    data: { body: req.body.body, isEdited: true },
    include: { user: { select: { id: true, username: true, name: true, profilePictureUrl: true } } },
  });
  ok(res, updated);
});

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
  if (!comment) { notFound(res); return; }
  if (comment.userId !== r.user.id) { forbidden(res); return; }
  await prisma.comment.update({ where: { id: req.params.id }, data: { isDeleted: true } });
  noContent(res);
});

export default router;
