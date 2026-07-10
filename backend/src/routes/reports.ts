import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { reportLimiter } from '../middleware/rateLimiter';
import { ok, created, notFound } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../config/prisma';

const router = Router();

const createReportSchema = z.object({
  type: z.enum(['VIOLENCE', 'NUDITY', 'SPAM', 'HARASSMENT', 'ILLEGAL_CONTENT', 'SELF_HARM', 'CSAM', 'IMPERSONATION', 'OTHER']),
  videoId: z.string().optional(),
  reportedUserId: z.string().optional(),
  commentId: z.string().optional(),
  description: z.string().max(1000).optional(),
});

router.post('/', requireAuth, reportLimiter, validate(createReportSchema), async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const report = await prisma.report.create({
    data: { ...req.body, reporterId: r.user.id },
  });
  created(res, { id: report.id, status: report.status });
});

router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  ok(res, reports);
});

router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const { status, resolution } = req.body as { status?: string; resolution?: string };
  const report = await prisma.report.update({
    where: { id: req.params.id },
    data: {
      status: status as 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED',
      resolution,
      reviewedAt: new Date(),
    },
  });
  ok(res, report);
});

export default router;
