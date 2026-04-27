import { IVectorRepository } from '../interfaces/IVectorRepository';
import { getChunksTable } from '../config/lanceDb';
import logger from '../config/logger';

/**
 * Implementation of IVectorRepository using LanceDB.
 */
export class VectorRepository implements IVectorRepository {
  private tableName = 'meeting_chunks';

  async insertChunk(
    meetingId: string,
    chunkIndex: number,
    text: string,
    vector: Float32Array,
    metadata: any
  ): Promise<void> {
    try {
      const table = await getChunksTable();
      await table.add([{
        vector,
        text,
        meetingId,
        chunkIndex,
        metadata: JSON.stringify(metadata),
      }]);
    } catch (error) {
      logger.error('Error inserting chunk into LanceDB', { error, meetingId, chunkIndex });
      throw error;
    }
  }

  async insertChunksBatch(
    chunks: Array<{
      meetingId: string;
      chunkIndex: number;
      text: string;
      vector: Float32Array;
      metadata: any;
    }>
  ): Promise<void> {
    try {
      const table = await getChunksTable();
      const data = chunks.map((c) => ({
        vector: c.vector,
        text: c.text,
        meetingId: c.meetingId,
        chunkIndex: c.chunkIndex,
        metadata: JSON.stringify(c.metadata),
      }));
      await table.add(data);
      logger.info('Inserted chunks batch into LanceDB', { count: chunks.length });
    } catch (error) {
      logger.error('Error inserting batch into LanceDB', { error });
      throw error;
    }
  }

  async searchSimilar(
    vector: Float32Array,
    limit: number,
    threshold: number = 0.7
  ): Promise<Array<{ text: string; meetingId: string; similarity: number; metadata: any }>> {
    try {
      const table = await getChunksTable();
      
      // LanceDB search returns distance (L2 or Cosine)
      // By default it might use L2. We can specify distance type if needed.
      const results = await table
        .vectorSearch(Array.from(vector))
        .limit(limit)
        .toArray();

      logger.info('Vector Search Raw Results', { 
        count: results.length,
        results: results.map(r => ({ dist: (r as any)._distance, text: (r as any).text.substring(0, 30) }))
      });

      return results.map((r: any) => ({
        text: r.text,
        meetingId: r.meetingId,
        similarity: Math.max(0, 1 - (r._distance || 0) / 2), // Better scaling for L2
        metadata: JSON.parse(r.metadata || '{}'),
      })).filter((r: any) => r.similarity >= threshold);
    } catch (error) {
      logger.error('Error searching LanceDB', { error });
      throw error;
    }
  }

  async deleteByMeetingId(meetingId: string): Promise<void> {
    try {
      const table = await getChunksTable();
      await table.delete(`meetingId = "${meetingId}"`);
      logger.info('Deleted chunks from LanceDB', { meetingId });
    } catch (error) {
      logger.error('Error deleting from LanceDB', { error, meetingId });
      throw error;
    }
  }

  async getChunkCount(meetingId?: string): Promise<number> {
    try {
      const table = await getChunksTable();
      if (meetingId) {
        // LanceDB Node SDK might not have a filtered countRows yet, 
        // fallback to querying if needed or use search query
        const results = await table.query().where(`meetingId = "${meetingId}"`).toArray();
        return results.length;
      }
      return await table.countRows();
    } catch (error) {
      logger.error('Error getting chunk count', { error });
      return 0;
    }
  }
}
