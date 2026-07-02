import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as videosService from '../services/videos';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadLimiter } from '../middleware/rateLimiter';
import { ok, noContent, notFound } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../config/prisma';
import { getStorage } from '../utils/storage';

const router = Router();

const publishSchema = z.object({
  sessionId: z.string().min(1),
  duration: z.number().min(15).max(100),
  fileSize: z.number().positive(),
  width: z.number().optional(),
  height: z.number().optional(),
  description: z.string().max(200).optional(),
  location: z.string().max(100).optional(),
  mood: z.string().max(50).optional(),
  weather: z.string().max(50).optional(),
  communityIds: z.array(z.string()).optional(),
  privacyMode: z.enum(['PUBLIC', 'FOLLOWERS_ONLY', 'PRIVATE', 'CLOSE_FRIENDS_ONLY']).optional(),
});

const updateDescriptionSchema = z.object({
  description: z.string().max(200),
});

router.get('/today/status', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const status = await videosService.getDailyStatus(r.user.id);
  ok(res, status);
});

router.post('/today/initiate', requireAuth, uploadLimiter, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const result = await videosService.initiateUpload(r.user.id);
  ok(res, result);
});

router.post('/today/publish', requireAuth, validate(publishSchema), async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const video = await videosService.publishVideo(r.user.id, req.body);
  ok(res, video);
});

router.delete('/today/session/:sessionId', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  await videosService.discardUpload(req.params.sessionId, r.user.id);
  noContent(res);
});

router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  const video = await videosService.getVideo(req.params.id, req.user?.id);
  ok(res, video);
});

router.patch('/:id', requireAuth, validate(updateDescriptionSchema), async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const video = await prisma.video.findUnique({ where: { id: req.params.id } });
  if (!video || video.userId !== r.user.id) { notFound(res); return; }
  const updated = await prisma.video.update({
    where: { id: req.params.id },
    data: { description: req.body.description },
  });
  ok(res, updated);
});

router.post('/:id/hide', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const video = await prisma.video.findUnique({ where: { id: req.params.id } });
  if (!video || video.userId !== r.user.id) { notFound(res); return; }
  const updated = await prisma.video.update({ where: { id: req.params.id }, data: { isHidden: true } });
  ok(res, updated);
});

router.post('/:id/unhide', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const video = await prisma.video.findUnique({ where: { id: req.params.id } });
  if (!video || video.userId !== r.user.id) { notFound(res); return; }
  const updated = await prisma.video.update({ where: { id: req.params.id }, data: { isHidden: false } });
  ok(res, updated);
});

router.post('/:id/archive', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const video = await prisma.video.findUnique({ where: { id: req.params.id } });
  if (!video || video.userId !== r.user.id) { notFound(res); return; }
  const updated = await prisma.video.update({ where: { id: req.params.id }, data: { isArchived: true } });
  ok(res, updated);
});

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  await videosService.deleteVideo(req.params.id, r.user.id);
  noContent(res);
});

router.get('/:id/stream', optionalAuth, async (req: Request, res: Response) => {
  const video = await videosService.getVideo(req.params.id, req.user?.id);
  const storage = getStorage();
  res.redirect(storage.getPublicUrl(video.storageKey));
});

export default router;
