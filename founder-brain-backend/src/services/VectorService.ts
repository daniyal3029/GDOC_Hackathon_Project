import { IVectorService } from '../interfaces/IVectorService';
import { IEmbeddingService } from '../interfaces/IEmbeddingService';
import { IVectorRepository } from '../interfaces/IVectorRepository';
import { ILogger } from '../interfaces/ILogger';
import { splitIntoChunks } from '../utils/textChunker';
import config from '../config/environment';

/**
 * Service for managing vector embeddings and indexing.
 */
export class VectorService implements IVectorService {
  constructor(
    private embeddingService: IEmbeddingService,
    private vectorRepository: IVectorRepository,
    private logger: ILogger
  ) {}

  async indexMeeting(
    meetingId: string,
    userId: string,
    text: string,
    summary: string,
    decisions: string[]
  ): Promise<number> {
    this.logger.info('Starting meeting indexing', { meetingId, userId });
    const startTime = Date.now();

    const combinedContent = `
      Summary: ${summary}
      Decisions: ${decisions.join(', ')}
      Full Transcript: ${text}
    `.trim();

    const chunks = splitIntoChunks(combinedContent);
    this.logger.info('Text split into chunks', { meetingId, chunkCount: chunks.length });

    await this.vectorRepository.deleteByMeetingId(meetingId);

    const batchSize = 10;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embeddings = await this.embeddingService.generateEmbeddings(batch);

      const chunkData = batch.map((text, index) => ({
        meetingId,
        userId,
        chunkIndex: i + index,
        text,
        vector: embeddings[index],
        metadata: {
          timestamp: new Date(),
          indexedAt: new Date(),
        }
      }));

      await this.vectorRepository.insertChunksBatch(chunkData);
    }

    const duration = Date.now() - startTime;
    this.logger.info('Meeting indexing completed', { 
      meetingId, 
      chunkCount: chunks.length, 
      durationMs: duration 
    });

    return chunks.length;
  }

  async searchContext(
    query: string,
    userId: string,
    limit: number = config.MAX_CONTEXT_CHUNKS || 5
  ): Promise<Array<{ text: string; meetingId: string; similarity: number; metadata: any }>> {
    const queryVector = await this.embeddingService.generateEmbedding(query);
    const results = await this.vectorRepository.searchSimilar(
      queryVector, 
      limit, 
      config.SIMILARITY_THRESHOLD || 0.7,
      { userId } // Pass userId filter to repository
    );

    return results;
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    await this.vectorRepository.deleteByMeetingId(meetingId);
  }
}
