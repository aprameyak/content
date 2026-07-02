import 'dotenv/config';
import { config } from './config';
import app from './app';
import { connectDatabase, disconnectDatabase } from './config/prisma';
import { connectRedis, disconnectRedis } from './config/redis';
import { startJobs, stopJobs } from './jobs';
import { logger } from './utils/logger';

let server: ReturnType<typeof app.listen>;

async function start() {
  await connectDatabase();
  await connectRedis();
  startJobs();

  server = app.listen(config.PORT, () => {
    logger.info(`Chronicle API running on port ${config.PORT} in ${config.NODE_ENV} mode`);
  });

  server.on('error', (err) => {
    logger.error('Server error', { err });
    process.exit(1);
  });
}

async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  stopJobs();
  server?.close(async () => {
    await disconnectDatabase();
    await disconnectRedis();
    logger.info('Shutdown complete');
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
});

start().catch((err) => {
  logger.error('Failed to start', { err });
  process.exit(1);
});
