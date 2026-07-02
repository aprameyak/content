import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtAccessPayload, JwtRefreshPayload, JwtTempPayload } from '../types';

export function generateAccessToken(payload: Omit<JwtAccessPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    config.JWT_ACCESS_SECRET,
    { expiresIn: config.JWT_ACCESS_EXPIRY } as jwt.SignOptions,
  );
}

export function generateRefreshToken(sub: string, sessionId: string): string {
  return jwt.sign(
    { sub, sessionId, type: 'refresh' } satisfies JwtRefreshPayload,
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRY } as jwt.SignOptions,
  );
}

export function generateTempToken(sub: string): string {
  return jwt.sign(
    { sub, type: 'temp_2fa' } satisfies JwtTempPayload,
    config.JWT_ACCESS_SECRET,
    { expiresIn: '10m' },
  );
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtAccessPayload;
  if (decoded.type !== 'access') throw new Error('Invalid token type');
  return decoded;
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET) as JwtRefreshPayload;
  if (decoded.type !== 'refresh') throw new Error('Invalid token type');
  return decoded;
}

export function verifyTempToken(token: string): JwtTempPayload {
  const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtTempPayload;
  if (decoded.type !== 'temp_2fa') throw new Error('Invalid token type');
  return decoded;
}
