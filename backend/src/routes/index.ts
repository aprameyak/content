import { Router, Request, Response } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import videoRoutes from './videos';
import uploadRoutes from './upload';
import feedRoutes from './feed';
import commentRoutes from './comments';
import reactionRoutes from './reactions';
import communityRoutes from './communities';
import searchRoutes from './search';
import notificationRoutes from './notifications';
import reportRoutes from './reports';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/videos', videoRoutes);
router.use('/upload', uploadRoutes);
router.use('/feed', feedRoutes);
router.use('/comments', commentRoutes);
router.use('/reactions', reactionRoutes);
router.use('/communities', communityRoutes);
router.use('/search', searchRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);

export default router;
