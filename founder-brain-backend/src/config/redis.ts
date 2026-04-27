import Redis from 'ioredis';
import config from './environment';
import logger from './logger';

/**
 * Redis client instance with retry strategy.
 */
export const redisClient = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = 3000; // 3 seconds
    if (times > 10) {
      logger.error('Max retry attempts reached for Redis connection.');
      return null;
    }
    logger.info(`Redis connection attempt ${times}, retrying in ${delay / 1000} seconds...`);
    return delay;
  },
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis.');
});

redisClient.on('error', (err) => {
  logger.error('Redis error', { error: err });
});

redisClient.on('end', () => {
  logger.warn('Redis connection closed.');
});

/**
 * Gracefully shuts down the Redis connection.
 */
export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    logger.info('Redis connection closed gracefully.');
  } catch (error) {
    logger.error('Error closing Redis connection', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
