import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';
import { IdempotencyRepository } from '../repositories/IdempotencyRepository';
import logger from '../config/logger';
import config from '../config/environment';

const QUEUE_NAME = 'maintenance-queue';
const JOB_NAME = 'cleanup-idempotency-records';

export const maintenanceQueue = new Queue(QUEUE_NAME, {
  connection: redisClient
});

/**
 * Cleanup job worker for idempotency records.
 */
export const startCleanupWorker = (idempotencyRepository: IdempotencyRepository) => {
  const worker = new Worker(QUEUE_NAME, async (job: Job) => {
    if (job.name === JOB_NAME) {
      logger.info('Starting idempotency records cleanup job...');
      const deletedCount = await idempotencyRepository.deleteExpired();
      logger.info(`Idempotency records cleanup completed. Deleted ${deletedCount} records.`);
      return { deletedCount };
    }
  }, { connection: redisClient });

  worker.on('failed', (job, err) => {
    logger.error('Cleanup job failed', { jobId: job?.id, error: err.message });
  });

  return worker;
};

/**
 * Schedule the cleanup job.
 */
export const scheduleCleanupJob = async () => {
  // Remove existing repeatable jobs for this name to avoid duplicates
  const repeatableJobs = await maintenanceQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.name === JOB_NAME) {
      await maintenanceQueue.removeRepeatableByKey(job.key);
    }
  }

  await maintenanceQueue.add(JOB_NAME, {}, {
    repeat: {
      pattern: config.IDEMPOTENCY_CLEANUP_CRON || '0 2 * * *'
    }
  });
  
  logger.info(`Scheduled idempotency records cleanup job with cron: ${config.IDEMPOTENCY_CLEANUP_CRON}`);
};
