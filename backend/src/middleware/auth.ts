import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { unauthorized } from '../utils/response';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    unauthorized(res);
    return;
  }
  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      twoFactorEnabled: payload.twoFactorEnabled,
    };
    next();
  } catch {
    unauthorized(res, 'Invalid or expired token');
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        username: payload.username,
        email: payload.email,
        twoFactorEnabled: payload.twoFactorEnabled,
      };
    } catch {
      // ignore — auth is optional
    }
  }
  next();
}
