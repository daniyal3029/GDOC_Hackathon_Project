import { Queue, Job } from 'bullmq';
import { redisClient } from '../config/redis';
import logger from '../config/logger';
import { EmailJobData } from '../types/job.types';

const QUEUE_NAME = 'email-notifications';

/**
 * BullMQ Queue for email notifications.
 */
export const emailQueue = new Queue<EmailJobData>(QUEUE_NAME, {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
  },
});

/**
 * Adds an email job to the queue.
 */
export const addEmailJob = async (email: string, otp: string, type: 'SIGNUP' | 'RESET_PASSWORD'): Promise<Job<EmailJobData>> => {
  try {
    const job = await emailQueue.add(
      'send-otp',
      { email, otp, type },
      { 
        jobId: `email-${type}-${email}-${Date.now()}`,
        priority: type === 'SIGNUP' ? 1 : 2 // Signup priority 
      }
    );
    logger.info('Email job added to queue', { jobId: job.id, email, type });
    return job;
  } catch (error) {
    logger.error('Error adding email job to queue', { error, email });
    throw error;
  }
};
