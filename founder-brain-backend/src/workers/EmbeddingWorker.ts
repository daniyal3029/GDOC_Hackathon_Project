import { Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';
import { EMBEDDING_QUEUE_NAME, EmbeddingJobData } from '../queues/embeddingQueue';
import { VectorService } from '../services/VectorService';
import { Meeting } from '../models/Meeting';

/**
 * Worker for processing embedding jobs.
 */
export const startEmbeddingWorker = async () => {
  const container = (await import('../config/container')).container;
  const logger = container.resolve<any>('Logger');

  const worker = new Worker(
    EMBEDDING_QUEUE_NAME,
    async (job: Job<EmbeddingJobData>) => {
      const { meetingId, userId, text, summary, decisions } = job.data;

      try {
        logger.info('Processing embedding job', { jobId: job.id, meetingId, userId });

        await Meeting.findByIdAndUpdate(meetingId, {
          embeddingStatus: 'processing'
        });

        const chunkCount = await vectorService.indexMeeting(
          meetingId,
          userId,
          text,
          summary,
          decisions
        );

        await Meeting.findByIdAndUpdate(meetingId, {
          embeddingStatus: 'completed',
          embeddingChunksCount: chunkCount,
          lastEmbeddedAt: new Date()
        });

        logger.info('Embedding job completed', { meetingId, chunkCount });
      } catch (error: any) {
        logger.error('Embedding job failed', {
          jobId: job.id,
          meetingId,
          error: error.message
        });

        await Meeting.findByIdAndUpdate(meetingId, {
          embeddingStatus: 'failed'
        });

        throw error;
      }
    },
    {
      connection: redisClient.duplicate(),
      concurrency: 2,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error('Embedding worker job failed', { jobId: job?.id, error: err.message });
  });

  return worker;
};
