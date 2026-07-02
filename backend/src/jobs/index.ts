import cron from 'node-cron';
import { logger } from '../utils/logger';
import { cleanExpiredUploads } from './uploadCleaner';
import { sendStreakReminders } from './streakReminder';

const jobs: cron.ScheduledTask[] = [];

export function startJobs(): void {
  // Clean expired uploads every hour
  jobs.push(
    cron.schedule('0 * * * *', async () => {
      logger.info('Running upload cleaner job');
      await cleanExpiredUploads();
    }),
  );

  // Send streak reminders at 8pm UTC (configurable)
  jobs.push(
    cron.schedule('0 20 * * *', async () => {
      logger.info('Running streak reminder job');
      await sendStreakReminders();
    }),
  );

  logger.info('Cron jobs started');
}

export function stopJobs(): void {
  for (const job of jobs) job.stop();
  logger.info('Cron jobs stopped');
}
