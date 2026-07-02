import { prisma } from '../config/prisma';
import { getUserCurrentDate, isYesterday } from './timezone';
import { STREAK_MILESTONES } from './constants';
import { logger } from './logger';

export function computeNextMilestone(currentStreak: number): number | undefined {
  return STREAK_MILESTONES.find((m) => m > currentStreak);
}

interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
  isNewMilestone: boolean;
  milestone?: number;
}

export async function updateUserStreak(userId: string): Promise<StreakUpdateResult> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const today = getUserCurrentDate(user.timezone);

  // Guard: already processed today
  if (user.lastPostedDate === today) {
    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      isNewMilestone: false,
    };
  }

  let newStreak: number;

  if (!user.lastPostedDate) {
    newStreak = 1;
  } else if (isYesterday(user.lastPostedDate, user.timezone)) {
    // Consecutive day
    newStreak = user.currentStreak + 1;
  } else {
    // Streak broken
    newStreak = 1;
  }

  const newLongest = Math.max(user.longestStreak, newStreak);
  const prevStreak = user.currentStreak;

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      totalPostsDays: { increment: 1 },
      lastPostedDate: today,
    },
  });

  // Check milestone crossed
  const milestone = STREAK_MILESTONES.find(
    (m) => newStreak >= m && prevStreak < m,
  );

  logger.info('Streak updated', { userId, newStreak, newLongest, milestone });

  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    isNewMilestone: !!milestone,
    milestone,
  };
}
