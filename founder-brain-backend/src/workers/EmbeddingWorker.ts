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
  const logger = container.resolve<any>('Logger');
  logger.info('Embedding worker disabled (using inline execution instead)');
  return null;
};
