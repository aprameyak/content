import { prisma } from '../config/prisma';
import { getUserCurrentDate } from '../utils/timezone';
import { logger } from '../utils/logger';

export async function sendStreakReminders(): Promise<void> {
  // Find users who haven't posted today and have notifications enabled
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      notifyDailyReminder: true,
    },
    select: { id: true, timezone: true, lastPostedDate: true },
  });

  const toNotify: string[] = [];
  for (const user of users) {
    const today = getUserCurrentDate(user.timezone);
    if (user.lastPostedDate !== today) {
      toNotify.push(user.id);
    }
  }

  if (toNotify.length === 0) return;

  await prisma.notification.createMany({
    data: toNotify.map((userId) => ({
      recipientId: userId,
      type: 'DAILY_REMINDER' as const,
      title: 'What did today look like?',
      body: 'Share your one authentic moment for today.',
    })),
    skipDuplicates: true,
  });

  logger.info(`Sent daily reminders to ${toNotify.length} users`);
}
