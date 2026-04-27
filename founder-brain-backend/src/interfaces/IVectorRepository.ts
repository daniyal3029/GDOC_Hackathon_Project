/**
 * Interface for Vector Repository.
 */
export interface IVectorRepository {
  /**
   * Inserts a single chunk into the vector database.
   */
  insertChunk(
    meetingId: string, 
    userId: string,
    chunkIndex: number, 
    text: string, 
    vector: Float32Array, 
    metadata: any
  ): Promise<void>;

  /**
   * Inserts a batch of chunks for performance.
   */
  insertChunksBatch(
    chunks: Array<{
      meetingId: string;
      userId: string;
      chunkIndex: number;
      text: string;
      vector: Float32Array;
      metadata: any;
    }>
  ): Promise<void>;

  /**
   * Searches for similar chunks based on a vector.
   */
  searchSimilar(
    vector: Float32Array, 
    limit: number, 
    threshold?: number,
    filters?: { userId?: string }
  ): Promise<Array<{
    text: string;
    meetingId: string;
    similarity: number;
    metadata: any;
  }>>;

  /**
   * Deletes all chunks associated with a meeting ID.
   */
  deleteByMeetingId(meetingId: string): Promise<void>;

  /**
   * Gets total chunk count or count per meeting.
   */
  getChunkCount(meetingId?: string): Promise<number>;
}
