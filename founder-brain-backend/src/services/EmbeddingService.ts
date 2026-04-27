import axios from 'axios';
import { pipeline } from '@xenova/transformers';
import crypto from 'crypto';
import { IEmbeddingService } from '../interfaces/IEmbeddingService';
import { redisClient } from '../config/redis';
import config from '../config/environment';
import logger from '../config/logger';
import AppError from '../utils/AppError';

import { ILogger } from '../interfaces/ILogger';

/**
 * Implementation of IEmbeddingService with support for OpenAI and Local models.
 */
export class EmbeddingService implements IEmbeddingService {
  private localPipeline: any = null;
  private cachePrefix = 'embedding:';
  private cacheTTL = 30 * 24 * 60 * 60; // 30 days

  constructor(private logger: ILogger) {}

  /**
   * Initializes the local embedding model if needed.
   */
  async initLocalModel(): Promise<void> {
    if (config.USE_LOCAL_EMBEDDINGS && !this.localPipeline) {
      logger.info('Initializing local embedding model (Xenova/all-MiniLM-L6-v2)...');
      this.localPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      logger.info('Local embedding model initialized.');
    }
  }

  async generateEmbedding(text: string): Promise<Float32Array> {
    const cacheKey = this.getCacheKey(text);
    
    // 1. Try cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return new Float32Array(JSON.parse(cached));
    }

    // 2. Generate embedding
    let embedding: Float32Array;
    if (config.USE_LOCAL_EMBEDDINGS) {
      embedding = await this.generateLocalEmbedding(text);
    } else {
      embedding = await this.generateOpenAIEmbedding(text);
    }

    // 3. Cache result
    await redisClient.set(cacheKey, JSON.stringify(Array.from(embedding)), 'EX', this.cacheTTL);

    return embedding;
  }

  async generateEmbeddings(batchTexts: string[]): Promise<Float32Array[]> {
    // For simplicity, we process each text. For OpenAI, we could batch the request.
    const results: Float32Array[] = [];
    for (const text of batchTexts) {
      results.push(await this.generateEmbedding(text));
    }
    return results;
  }

  getDimension(): number {
    return config.EMBEDDING_DIMENSION;
  }

  private async generateOpenAIEmbedding(text: string): Promise<Float32Array> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          input: text,
          model: config.EMBEDDING_MODEL,
        },
        {
          headers: {
            'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const embedding = response.data.data[0].embedding;
      return new Float32Array(embedding);
    } catch (error: any) {
      logger.error('OpenAI Embedding error', { error: error.message });
      throw new AppError('Failed to generate OpenAI embedding', 500);
    }
  }

  private async generateLocalEmbedding(text: string): Promise<Float32Array> {
    await this.initLocalModel();
    try {
      const result = await this.localPipeline(text, { pooling: 'mean', normalize: true });
      return new Float32Array(result.data);
    } catch (error: any) {
      logger.error('Local Embedding error', { error: error.message });
      throw new AppError('Failed to generate local embedding', 500);
    }
  }

  private getCacheKey(text: string): string {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    return `${this.cachePrefix}${hash}`;
  }
}
