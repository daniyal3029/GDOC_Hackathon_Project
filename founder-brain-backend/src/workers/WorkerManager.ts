import { Worker } from 'bullmq';
import { redisClient } from '../config/redis';
import config from '../config/environment';
import { container } from '../config/container';
import { startCleanupWorker, scheduleCleanupJob } from '../jobs/cleanupIdempotencyRecords';
import { startSecurityWorker, scheduleSecurityJob } from '../jobs/rateLimitAlertJob';
import { startMetricsAggregationWorker, scheduleMetricsAggregationJob } from '../jobs/metricsAggregationJob';
import { startLogCleanupWorker, scheduleLogCleanupJob } from '../jobs/logCleanupJob';

let worker: Worker | null = null;
let emailQueueWorker: Worker | null = null;
let cleanupWorker: Worker | null = null;
let securityWorker: Worker | null = null;
let metricsWorker: Worker | null = null;
let logCleanupWorker: Worker | null = null;

/**
 * Starts the background workers.
 */
export const startWorker = async (): Promise<void> => {
  const logger = container.resolve<any>('Logger');
  const idempotencyRepository = container.resolve<any>('IdempotencyRepository');

  // 1. Meeting Processing Worker
  const meetingWorker = container.getMeetingWorker();
  worker = new Worker(
    'meeting-processing',
    async (job) => {
      await meetingWorker.process(job);
    },
    {
      connection: redisClient.duplicate(),
      concurrency: config.MAX_CONCURRENT_JOBS || 5,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error(`Worker job ${job?.id} failed`, { error: err.message });
  });

  // 1b. Email Notification Worker
  const emailWorker = container.getEmailWorker();
  emailQueueWorker = new Worker(
    'email-notifications',
    async (job) => {
      await emailWorker.process(job);
    },
    {
      connection: redisClient.duplicate(),
      concurrency: 5,
    }
  );

  emailQueueWorker.on('failed', (job, err) => {
    logger.error(`Email job ${job?.id} failed`, { error: err.message, email: job?.data?.email });
  });

  // 2. Maintenance / Cleanup Worker
  cleanupWorker = startCleanupWorker(idempotencyRepository);
  await scheduleCleanupJob();

  // 3. Security / Abuse Scan Worker
  securityWorker = startSecurityWorker();
  await scheduleSecurityJob();

  // 4. Metrics Aggregation Worker
  metricsWorker = startMetricsAggregationWorker();
  await scheduleMetricsAggregationJob();

  // 5. Log Cleanup Worker
  logCleanupWorker = startLogCleanupWorker();
  await scheduleLogCleanupJob();

  logger.info('Background workers started', { concurrency: config.MAX_CONCURRENT_JOBS || 5 });
};

/**
 * Stops the background workers gracefully.
 */
export const stopWorker = async (): Promise<void> => {
  const logger = container.resolve<any>('Logger');

  if (worker) {
    logger.info('Stopping meeting worker gracefully...');
    await worker.close();
    worker = null;
  }

  if (emailQueueWorker) {
    logger.info('Stopping email worker gracefully...');
    await emailQueueWorker.close();
    emailQueueWorker = null;
  }

  if (cleanupWorker) {
    logger.info('Stopping cleanup worker gracefully...');
    await cleanupWorker.close();
    cleanupWorker = null;
  }

  if (securityWorker) {
    logger.info('Stopping security worker gracefully...');
    await securityWorker.close();
    securityWorker = null;
  }

  if (metricsWorker) {
    logger.info('Stopping metrics worker gracefully...');
    await metricsWorker.close();
    metricsWorker = null;
  }

  if (logCleanupWorker) {
    logger.info('Stopping log cleanup worker gracefully...');
    await logCleanupWorker.close();
    logCleanupWorker = null;
  }

  logger.info('All workers stopped.');
};
