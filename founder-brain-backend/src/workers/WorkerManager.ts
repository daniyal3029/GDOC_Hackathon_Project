import { Worker } from 'bullmq';
import { redisClient } from '../config/redis';
import config from '../config/environment';
import { container } from '../config/container';
import { startCleanupWorker, scheduleCleanupJob } from '../jobs/cleanupIdempotencyRecords';
import { startSecurityWorker, scheduleSecurityJob } from '../jobs/rateLimitAlertJob';
import { startMetricsAggregationWorker, scheduleMetricsAggregationJob } from '../jobs/metricsAggregationJob';
import { startLogCleanupWorker, scheduleLogCleanupJob } from '../jobs/logCleanupJob';

let worker: Worker | null = null;
let cleanupWorker: Worker | null = null;
let securityWorker: Worker | null = null;
let metricsWorker: Worker | null = null;
let logCleanupWorker: Worker | null = null;

/**
 * Starts the background workers.
 */
export const startWorker = async (): Promise<void> => {
  const logger = container.resolve<any>('Logger');
  logger.info('Background workers disabled (using inline execution instead)');
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
