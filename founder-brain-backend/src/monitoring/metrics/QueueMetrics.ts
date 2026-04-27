import { Queue } from 'bullmq';
import { redisClient } from '../../config/redis';
import { bullmqActiveJobs, bullmqWaitingJobs, bullmqFailedJobsTotal } from './MetricsService';
import logger from '../../config/logger';

const queues: Map<string, Queue> = new Map();

/**
 * Registers a BullMQ queue for metric collection.
 */
export const registerQueue = (name: string) => {
  if (!queues.has(name)) {
    queues.set(name, new Queue(name, { connection: redisClient }));
  }
};

/**
 * Collects current queue stats and updates Prometheus gauges.
 * Should be called on a timer (e.g., every 30 seconds).
 */
export const collectQueueMetrics = async (): Promise<void> => {
  for (const [name, queue] of queues.entries()) {
    try {
      const counts = await queue.getJobCounts('active', 'waiting', 'failed', 'delayed');
      bullmqActiveJobs.set({ queue: name }, counts.active || 0);
      bullmqWaitingJobs.set({ queue: name }, counts.waiting || 0);
    } catch (error: any) {
      logger.error(`Failed to collect queue metrics for ${name}`, { error: error.message });
    }
  }
};

let intervalId: NodeJS.Timeout | null = null;

/**
 * Starts the periodic queue metrics collector.
 */
export const startQueueMetricsCollector = (intervalMs: number = 30000) => {
  // Register known queues
  registerQueue('meeting-processing');
  registerQueue('security-queue');
  registerQueue('maintenance-queue');

  // Initial collection
  collectQueueMetrics().catch(() => {});

  // Periodic collection
  intervalId = setInterval(() => {
    collectQueueMetrics().catch(() => {});
  }, intervalMs);

  logger.info(`Queue metrics collector started (interval: ${intervalMs}ms)`);
};

/**
 * Stops the periodic collector.
 */
export const stopQueueMetricsCollector = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};
