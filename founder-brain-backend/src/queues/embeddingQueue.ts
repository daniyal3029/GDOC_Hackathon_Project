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
  text: string;
  summary: string;
  decisions: string[];
}

/**
 * Adds a meeting to the embedding queue.
 */
import { container } from '../config/container';
import { Meeting } from '../models/Meeting';

export const addEmbeddingJob = async (data: EmbeddingJobData) => {
  try {
    const vectorService = container.resolve<any>('VectorService');
    
    setTimeout(async () => {
      try {
        logger.info('Processing embedding job synchronously', { meetingId: data.meetingId });
        await Meeting.findByIdAndUpdate(data.meetingId, { embeddingStatus: 'processing' });
        const chunkCount = await vectorService.indexMeeting(data.meetingId, data.text, data.summary, data.decisions);
        await Meeting.findByIdAndUpdate(data.meetingId, { embeddingStatus: 'completed', embeddingChunksCount: chunkCount, lastEmbeddedAt: new Date() });
        logger.info('Embedding job completed', { meetingId: data.meetingId, chunkCount });
      } catch (err: any) {
        logger.error('Embedding job failed', { meetingId: data.meetingId, error: err.message });
        await Meeting.findByIdAndUpdate(data.meetingId, { embeddingStatus: 'failed' });
      }
    }, 0);
    
    logger.info('Added embedding job for meeting', { meetingId: data.meetingId });
  } catch (error) {
    logger.error('Failed to add embedding job to queue', { error, meetingId: data.meetingId });
  }
};
