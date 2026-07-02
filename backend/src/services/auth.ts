import { prisma } from '../config/prisma';
import { getRedis } from '../config/redis';
import { hashPassword, verifyPassword } from '../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTempToken,
  verifyRefreshToken,
  verifyTempToken,
} from '../utils/jwt';
import { generateTOTPSecret, verifyTOTPToken, getTOTPUri } from '../utils/totp';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { isValidTimezone } from '../utils/timezone';

const REFRESH_PREFIX = 'refresh:';

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  name: string;
  birthday: string;
  timezone: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    name: string;
    twoFactorEnabled: boolean;
  };
}

export interface LoginInput {
  emailOrUsername: string;
  password: string;
  deviceInfo?: {
    fcmToken?: string;
    apnsToken?: string;
    platform?: 'IOS' | 'ANDROID';
    appVersion?: string;
    osVersion?: string;
    deviceModel?: string;
  };
}

async function createSession(userId: string, ipAddress?: string, userAgent?: string) {
  const session = await prisma.session.create({
    data: {
      userId,
      refreshToken: 'pending',
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  const refreshToken = generateRefreshToken(userId, session.id);
  await prisma.session.update({
    where: { id: session.id },
    data: { refreshToken },
  });
  // Cache in Redis for quick lookup
  const redis = getRedis();
  await redis.setex(`${REFRESH_PREFIX}${refreshToken}`, 7 * 24 * 60 * 60, userId);
  return { session, refreshToken };
}

export async function register(input: RegisterInput): Promise<AuthTokens> {
  if (!isValidTimezone(input.timezone)) {
    throw new AppError(400, 'INVALID_TIMEZONE', 'Invalid timezone');
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
  });
  if (existing) {
    if (existing.email === input.email) {
      throw new AppError(409, 'EMAIL_TAKEN', 'Email is already in use');
    }
    throw new AppError(409, 'USERNAME_TAKEN', 'Username is already taken');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      username: input.username.toLowerCase(),
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
      birthday: new Date(input.birthday),
      timezone: input.timezone,
    },
  });

  const { refreshToken, session } = await createSession(user.id);
  const accessToken = generateAccessToken({
    sub: user.id,
    username: user.username,
    email: user.email,
    twoFactorEnabled: false,
  });

  logger.info('User registered', { userId: user.id, username: user.username });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      twoFactorEnabled: false,
    },
  };
}

export async function login(
  input: LoginInput,
  ipAddress?: string,
  userAgent?: string,
): Promise<AuthTokens | { requires2FA: true; tempToken: string }> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: input.emailOrUsername.toLowerCase() },
        { username: input.emailOrUsername.toLowerCase() },
      ],
      isActive: true,
      deletedAt: null,
    },
  });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (user.isSuspended) {
    throw new AppError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended');
  }

  if (user.twoFactorEnabled) {
    const tempToken = generateTempToken(user.id);
    return { requires2FA: true, tempToken };
  }

  const { refreshToken } = await createSession(user.id, ipAddress, userAgent);
  const accessToken = generateAccessToken({
    sub: user.id,
    username: user.username,
    email: user.email,
    twoFactorEnabled: user.twoFactorEnabled,
  });

  // Register device if info provided
  if (input.deviceInfo?.platform) {
    await prisma.device.upsert({
      where: {
        userId_fcmToken: {
          userId: user.id,
          fcmToken: input.deviceInfo.fcmToken ?? '',
        },
      },
      update: { ...input.deviceInfo },
      create: {
        userId: user.id,
        platform: input.deviceInfo.platform,
        ...input.deviceInfo,
      },
    });
  }

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      twoFactorEnabled: user.twoFactorEnabled,
    },
  };
}

export async function login2FA(
  tempToken: string,
  code: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<AuthTokens> {
  const payload = verifyTempToken(tempToken);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });

  if (!user.twoFactorSecret) {
    throw new AppError(400, 'TWO_FACTOR_NOT_SETUP', '2FA not configured');
  }

  if (!verifyTOTPToken(code, user.twoFactorSecret)) {
    throw new AppError(401, 'INVALID_2FA_CODE', 'Invalid authenticator code');
  }

  const { refreshToken } = await createSession(user.id, ipAddress, userAgent);
  const accessToken = generateAccessToken({
    sub: user.id,
    username: user.username,
    email: user.email,
    twoFactorEnabled: true,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      twoFactorEnabled: true,
    },
  };
}

export async function logout(refreshToken: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`${REFRESH_PREFIX}${refreshToken}`);
  await prisma.session.deleteMany({ where: { refreshToken } });
}

export async function refreshTokens(
  oldRefreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = verifyRefreshToken(oldRefreshToken);

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId, refreshToken: oldRefreshToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Session expired or not found');
  }

  // Rotate refresh token
  const newRefreshToken = generateRefreshToken(session.userId, session.id);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.update({
    where: { id: session.id },
    data: { refreshToken: newRefreshToken, expiresAt },
  });

  const redis = getRedis();
  await redis.del(`${REFRESH_PREFIX}${oldRefreshToken}`);
  await redis.setex(`${REFRESH_PREFIX}${newRefreshToken}`, 7 * 24 * 60 * 60, session.userId);

  const accessToken = generateAccessToken({
    sub: session.user.id,
    username: session.user.username,
    email: session.user.email,
    twoFactorEnabled: session.user.twoFactorEnabled,
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function setup2FA(userId: string): Promise<{ secret: string; qrCodeUri: string }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const secret = generateTOTPSecret();
  const qrCodeUri = getTOTPUri(user.username, secret);

  // Store secret temporarily (not yet enabled)
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  });

  return { secret, qrCodeUri };
}

export async function verify2FA(userId: string, code: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.twoFactorSecret) {
    throw new AppError(400, 'TWO_FACTOR_NOT_SETUP', 'Run setup first');
  }
  if (!verifyTOTPToken(code, user.twoFactorSecret)) {
    throw new AppError(401, 'INVALID_2FA_CODE', 'Invalid code');
  }
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });
}

export async function disable2FA(userId: string, code: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.twoFactorSecret || !verifyTOTPToken(code, user.twoFactorSecret)) {
    throw new AppError(401, 'INVALID_2FA_CODE', 'Invalid code');
  }
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });
}
