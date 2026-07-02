import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import { ok, created, noContent, badRequest } from '../utils/response';
import { AuthenticatedRequest } from '../types';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/i, 'Only letters, numbers, underscores'),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(80),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  timezone: z.string().min(1),
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(1),
  deviceInfo: z.object({
    fcmToken: z.string().optional(),
    apnsToken: z.string().optional(),
    platform: z.enum(['IOS', 'ANDROID']).optional(),
    appVersion: z.string().optional(),
    osVersion: z.string().optional(),
    deviceModel: z.string().optional(),
  }).optional(),
});

const login2FASchema = z.object({
  tempToken: z.string().min(1),
  code: z.string().length(6),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const totpCodeSchema = z.object({
  code: z.string().length(6),
});

router.post('/register', authLimiter, validate(registerSchema), async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  created(res, result);
});

router.post('/login', authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  const result = await authService.login(req.body, req.ip, req.headers['user-agent']);
  ok(res, result);
});

router.post('/login/2fa', authLimiter, validate(login2FASchema), async (req: Request, res: Response) => {
  const result = await authService.login2FA(req.body.tempToken, req.body.code, req.ip, req.headers['user-agent']);
  ok(res, result);
});

router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (refreshToken) await authService.logout(refreshToken);
  noContent(res);
});

router.post('/refresh', validate(refreshSchema), async (req: Request, res: Response) => {
  const result = await authService.refreshTokens(req.body.refreshToken);
  ok(res, result);
});

router.post('/2fa/setup', requireAuth, async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  const result = await authService.setup2FA(r.user.id);
  ok(res, result);
});

router.post('/2fa/verify', requireAuth, validate(totpCodeSchema), async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  await authService.verify2FA(r.user.id, req.body.code);
  ok(res, { enabled: true });
});

router.delete('/2fa', requireAuth, validate(totpCodeSchema), async (req: Request, res: Response) => {
  const r = req as AuthenticatedRequest;
  await authService.disable2FA(r.user.id, req.body.code);
  ok(res, { enabled: false });
});

router.post('/forgot-password', authLimiter, async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email) { badRequest(res, 'Email required'); return; }
  // TODO: send email with reset link
  // For now log it
  const token = Math.random().toString(36).slice(2);
  console.log(`[DEV] Password reset link: /reset-password?token=${token} for ${email}`);
  ok(res, { message: 'If that email exists, a reset link has been sent.' });
});

router.post('/reset-password', authLimiter, async (_req: Request, res: Response) => {
  // TODO: implement with token verification
  ok(res, { message: 'Password reset. Please log in.' });
});

export default router;
