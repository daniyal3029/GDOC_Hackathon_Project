import { Queue } from 'bullmq';
import { redisClient } from '../config/redis';
import logger from '../config/logger';

export const EMBEDDING_QUEUE_NAME = 'embedding-generation';

/**
 * Queue for generating embeddings for processed meetings.
 */
export const embeddingQueue = new Queue(EMBEDDING_QUEUE_NAME, {
  connection: redisClient.duplicate(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
  },
});

/**
 * Interface for embedding job data.
 */
export interface EmbeddingJobData {
  meetingId: string;
  userId: string;
  text: string;
  summary: string;
  decisions: string[];
}

/**
 * Adds a meeting to the embedding queue.
 */
export const addEmbeddingJob = async (data: EmbeddingJobData) => {
  try {
    await embeddingQueue.add(`embedding-${data.meetingId}`, data);
    logger.info('Added embedding job for meeting', { meetingId: data.meetingId });
  } catch (error) {
    logger.error('Failed to add embedding job to queue', { error, meetingId: data.meetingId });
  }
};
