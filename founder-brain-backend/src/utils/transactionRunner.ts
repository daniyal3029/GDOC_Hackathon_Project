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
  let attempts = 0;

  while (attempts < maxRetries) {
    const session = await mongoose.startSession();
    
    try {
      attempts++;
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      });

      const result = await callback(session);

      await session.commitTransaction();
      return result;
    } catch (error: any) {
      await session.abortTransaction();

      const isTransient = error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError');
      const isCommitError = error.hasErrorLabel && error.hasErrorLabel('UnknownTransactionCommitResult');

      if ((isTransient || isCommitError) && attempts < maxRetries) {
        logger.warn(`Transaction retryable error [attempt ${attempts}]: ${error.message}`);
        continue;
      }

      logger.error(`Transaction failed after ${attempts} attempts: ${error.message}`, {
        stack: error.stack,
        labels: error.errorLabels
      });
      throw error;
    } finally {
      await session.endSession();
    }
  }

  throw new Error(`Transaction failed after ${maxRetries} retries.`);
};
