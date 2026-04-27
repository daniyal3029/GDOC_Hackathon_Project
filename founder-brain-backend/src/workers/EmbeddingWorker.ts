import { Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';
import { EMBEDDING_QUEUE_NAME, EmbeddingJobData } from '../queues/embeddingQueue';
import { VectorService } from '../services/VectorService';
import { EmbeddingService } from '../services/EmbeddingService';
import { VectorRepository } from '../repositories/VectorRepository';
import { Meeting } from '../models/Meeting';
import logger from '../config/logger';

/**
 * Worker for processing embedding jobs.
 */
export const startEmbeddingWorker = async () => {
  const container = (await import('../config/container')).container;
  const vectorService = container.resolve<VectorService>('VectorService');
  const logger = container.resolve<any>('Logger');

  const worker = new Worker(
    EMBEDDING_QUEUE_NAME,
    async (job: Job<EmbeddingJobData>) => {
      const { meetingId, text, summary, decisions } = job.data;
      
      try {
        logger.info('Processing embedding job', { jobId: job.id, meetingId });
        
        // Update status to processing
        await Meeting.findByIdAndUpdate(meetingId, { 
          embeddingStatus: 'processing' 
        });

        const chunkCount = await vectorService.indexMeeting(
          meetingId,
          text,
          summary,
          decisions
        );

        // Update status to completed
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
      concurrency: 2, // Limit concurrent embedding tasks
    }
  );

  worker.on('failed', (job, err) => {
    logger.error('Embedding worker job failed', { jobId: job?.id, error: err.message });
  });

  return worker;
};
