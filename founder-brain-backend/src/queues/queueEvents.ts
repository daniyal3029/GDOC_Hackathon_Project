import { QueueEvents } from 'bullmq';
import { redisClient } from '../config/redis';
import logger from '../config/logger';

const QUEUE_NAME = 'meeting-processing';

/**
 * BullMQ QueueEvents listener for meeting processing.
 */
export const meetingQueueEvents = new QueueEvents(QUEUE_NAME, {
  connection: redisClient,
});

meetingQueueEvents.on('completed', ({ jobId, returnvalue }) => {
  logger.info('Job completed successfully', { jobId, returnvalue });
});

meetingQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error('Job failed', { jobId, failedReason });
});

meetingQueueEvents.on('progress', ({ jobId, data }) => {
  logger.debug('Job progress update', { jobId, progress: data });
});

meetingQueueEvents.on('stalled', ({ jobId }) => {
  logger.warn('Job stalled', { jobId });
});

export default meetingQueueEvents;
