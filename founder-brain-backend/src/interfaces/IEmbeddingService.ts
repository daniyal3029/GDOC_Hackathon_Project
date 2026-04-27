/**
 * Interface for Embedding Service.
 */
export interface IEmbeddingService {
  /**
   * Generates a vector embedding for a given text.
   * @param text - The text to embed.
   */
  generateEmbedding(text: string): Promise<Float32Array>;

  /**
   * Generates embeddings for a batch of texts.
   * @param batchTexts - Array of texts to embed.
   */
  generateEmbeddings(batchTexts: string[]): Promise<Float32Array[]>;

  /**
   * Gets the dimension of the embeddings produced by this service.
   */
  getDimension(): number;
}
