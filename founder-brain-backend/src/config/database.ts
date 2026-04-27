import mongoose from 'mongoose';
import logger from './logger';
import config from './environment';

/**
 * Connects to MongoDB database with performance optimizations.
 */
export const connectDB = async (): Promise<void> => {
  try {
    const options: mongoose.ConnectOptions = {
      // Performance Pooling
      minPoolSize: 10,
      maxPoolSize: 100,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    };

    await mongoose.connect(config.MONGODB_URI, options);
    logger.info('Connected to MongoDB successfully with connection pooling.');
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: error instanceof Error ? error.message : 'Unknown' });
    process.exit(1);
  }
};
