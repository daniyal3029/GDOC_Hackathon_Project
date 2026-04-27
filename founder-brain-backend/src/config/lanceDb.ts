import * as lancedb from '@lancedb/lancedb';
import * as arrow from 'apache-arrow';
import config from './environment';
import logger from './logger';
import path from 'path';
import fs from 'fs';

let db: lancedb.Connection | null = null;
const TABLE_NAME = 'meeting_chunks';

/**
 * Initializes the LanceDB connection and table.
 */
export const initLanceDb = async (): Promise<void> => {
  try {
    const dbPath = path.resolve(config.VECTOR_DB_PATH);
    
    // Ensure directory exists
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    db = await lancedb.connect(dbPath);
    logger.info(`LanceDB initialized at ${dbPath}`);

    const tableNames = await db.tableNames();
    
    if (!tableNames.includes(TABLE_NAME)) {
      logger.info(`Creating table: ${TABLE_NAME}`);
      
      // Define schema using Apache Arrow
      const schema = new arrow.Schema([
        new arrow.Field('vector', new arrow.Float32()),
        new arrow.Field('text', new arrow.Utf8()),
        new arrow.Field('meetingId', new arrow.Utf8()),
        new arrow.Field('chunkIndex', new arrow.Int32()),
        new arrow.Field('metadata', new arrow.Utf8()),
      ]);

      // Create an empty table with the defined schema
      // In @lancedb/lancedb v0.4.x+, we can create an empty table by passing schema
      // but the API varies. A safer way is to provide dummy data if needed or just use simple objects.
      // LanceDB can infer schema from the first row of data.
      
      const dummyData = [
        {
          vector: new Float32Array(config.EMBEDDING_DIMENSION).fill(0),
          text: 'initialization',
          meetingId: 'init',
          chunkIndex: -1,
          metadata: JSON.stringify({}),
        }
      ];
      
      await db.createTable(TABLE_NAME, dummyData);
      logger.info(`Table ${TABLE_NAME} created successfully`);
    }
  } catch (error) {
    logger.error('Failed to initialize LanceDB', { error });
    throw error;
  }
};

/**
 * Gets the LanceDB connection.
 */
export const getVectorDb = (): lancedb.Connection => {
  if (!db) {
    throw new Error('LanceDB not initialized. Call initLanceDb() first.');
  }
  return db;
};

/**
 * Gets the meeting_chunks table.
 */
export const getChunksTable = async (): Promise<lancedb.Table> => {
  const connection = getVectorDb();
  return await connection.openTable(TABLE_NAME);
};

/**
 * Gracefully closes the LanceDB connection.
 */
export const closeLanceDb = async (): Promise<void> => {
  // LanceDB connection closing is handled by the process exit usually, 
  // but we can clear the reference.
  db = null;
  logger.info('LanceDB connection closed');
};
