import config from '../config/environment';
import { ILogger } from '../interfaces/ILogger';
import { EmbeddingService } from '../services/EmbeddingService';
import { IEmbeddingService } from '../interfaces/IEmbeddingService';

/**
 * Factory for creating the appropriate Embedding Service.
 */
export class EmbeddingServiceFactory {
  /**
   * Creates an instance of IEmbeddingService based on configuration.
   */
  static create(logger: ILogger): IEmbeddingService {
    const useLocal = config.USE_LOCAL_EMBEDDINGS;
    logger.debug('Creating Embedding Service', { useLocal, model: useLocal ? 'Local-MiniLM' : config.EMBEDDING_MODEL });
    
    // In our current implementation, EmbeddingService handles both internally.
    // If we had separate classes, we would instantiate them here.
    return new EmbeddingService(logger);
  }
}
