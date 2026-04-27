import { Queue, Job } from 'bullmq';
import { redisClient } from '../config/redis';
import config from '../config/environment';
import logger from '../config/logger';
import { MeetingJobData } from '../types/job.types';

const QUEUE_NAME = 'meeting-processing';

/**
 * BullMQ Queue for meeting processing.
 */
export const meetingQueue = new Queue<MeetingJobData>(QUEUE_NAME, {
  connection: redisClient,
  defaultJobOptions: {
    attempts: parseInt(process.env.QUEUE_RETRY_ATTEMPTS || '3', 10),
    backoff: {
      type: 'exponential',
      delay: parseInt(process.env.QUEUE_RETRY_DELAY || '5000', 10),
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

/**
 * Adds a meeting processing job to the queue.
 * @param meetingId - The ID of the meeting document.
 * @param text - The raw meeting text.
 */
export const addMeetingJob = async (meetingId: string, text: string): Promise<Job<MeetingJobData>> => {
  try {
    const job = await meetingQueue.add(
      'process-meeting',
      { meetingId, text },
      { jobId: `meeting-${meetingId}` } // Idempotency by meeting ID
    );
    logger.info('Meeting job added to queue', { jobId: job.id, meetingId });
    return job;
  } catch (error) {
    logger.error('Error adding meeting job to queue', { error, meetingId });
    throw error;
  }
};

/**
 * Retrieves the status of a job.
 * @param jobId - The ID of the job.
 */
export const getJobStatus = async (jobId: string): Promise<Job<MeetingJobData> | undefined> => {
  return await meetingQueue.getJob(jobId);
};

/**
 * Retrieves metrics for the queue.
 */
export const getQueueMetrics = async () => {
  const [waiting, active, completed, failed] = await Promise.all([
    meetingQueue.getWaitingCount(),
    meetingQueue.getActiveCount(),
    meetingQueue.getCompletedCount(),
    meetingQueue.getFailedCount(),
  ]);

  return { waiting, active, completed, failed };
};
