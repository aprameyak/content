import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { ok, noContent } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../config/prisma';
import { NOTIFICATION_PAGE_SIZE } from '../utils/constants';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const { cursor } = req.query as { cursor?: string };

  const notifications = await prisma.notification.findMany({
    where: {
      recipientId: r.user.id,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: NOTIFICATION_PAGE_SIZE + 1,
    include: {
      sender: { select: { id: true, username: true, name: true, profilePictureUrl: true } },
    },
  });

  const hasMore = notifications.length > NOTIFICATION_PAGE_SIZE;
  const items = hasMore ? notifications.slice(0, NOTIFICATION_PAGE_SIZE) : notifications;

  ok(res, { items, hasMore, nextCursor: hasMore ? items[items.length - 1].createdAt.toISOString() : undefined });
});

router.get('/unread-count', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const count = await prisma.notification.count({
    where: { recipientId: r.user.id, isRead: false },
  });
  ok(res, { count });
});

router.patch('/:id/read', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  await prisma.notification.updateMany({
    where: { id: req.params.id, recipientId: r.user.id },
    data: { isRead: true },
  });
  noContent(res);
});

router.post('/read-all', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  await prisma.notification.updateMany({
    where: { recipientId: r.user.id, isRead: false },
    data: { isRead: true },
  });
  ok(res, { success: true });
});

export default router;
