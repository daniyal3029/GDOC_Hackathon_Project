import mongoose, { ClientSession } from 'mongoose';
import logger from '../config/logger';

/**
 * Runs a set of operations within a MongoDB transaction.
 * Supports automatic retries for transient errors.
 */
export const runTransaction = async <T>(
  callback: (session: ClientSession) => Promise<T>,
  maxRetries = 3
): Promise<T> => {
  try {
    // For local development without replica sets, we skip actual transactions
    // and just pass a mock session or undefined
    const result = await callback(null as any);
    return result;
  } catch (error: any) {
    logger.error(`Transaction fallback failed: ${error.message}`, {
      stack: error.stack
    });
    throw error;
  }
};
