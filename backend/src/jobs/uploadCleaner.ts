import { prisma } from '../config/prisma';
import { getStorage } from '../utils/storage';
import { logger } from '../utils/logger';

export async function cleanExpiredUploads(): Promise<void> {
  const expired = await prisma.uploadSession.findMany({
    where: {
      status: { in: ['PENDING', 'UPLOADING'] },
      expiresAt: { lt: new Date() },
    },
  });

  if (expired.length === 0) return;

  logger.info(`Cleaning ${expired.length} expired upload sessions`);
  const storage = getStorage();

  for (const session of expired) {
    try {
      const exists = await storage.fileExists(session.storageKey);
      if (exists) await storage.deleteFile(session.storageKey);
      await prisma.uploadSession.update({
        where: { id: session.id },
        data: { status: 'EXPIRED' },
      });
    } catch (err) {
      logger.error('Failed to clean upload session', { sessionId: session.id, err });
    }
  }
}
