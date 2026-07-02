import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';
import { ok, noContent, badRequest } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import * as videosService from '../services/videos';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per chunk
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('video/')) {
      cb(new Error('Only video files allowed'));
      return;
    }
    cb(null, true);
  },
});

router.post('/initiate', requireAuth, uploadLimiter, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const result = await videosService.initiateUpload(r.user.id);
  ok(res, result);
});

router.post(
  '/:sessionId/chunk',
  requireAuth,
  upload.single('chunk'),
  async (req: Request, res: Response) => {
    const r = req as AuthenticatedRequest;
    if (!req.file) { badRequest(res, 'No chunk provided'); return; }
    await videosService.appendChunk(req.params.sessionId, r.user.id, req.file.buffer);
    ok(res, { received: req.file.size });
  },
);

router.post('/:sessionId/complete', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  await videosService.completeUpload(req.params.sessionId, r.user.id);
  ok(res, { ready: true });
});

router.delete('/:sessionId', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  await videosService.discardUpload(req.params.sessionId, r.user.id);
  noContent(res);
});

export default router;
