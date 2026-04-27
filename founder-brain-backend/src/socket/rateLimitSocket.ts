import { Socket } from 'socket.io';
import { redisClient } from '../config/redis';

/**
 * Validates whether a socket should be rate limited for sending messages.
 * Uses a simple sliding window counter in Redis.
 */
export const checkSocketRateLimit = async (socketId: string, limit: number = 100, windowSecs: number = 60): Promise<boolean> => {
  const key = `ws:msgs:${socketId}`;
  
  try {
    const current = await redisClient.incr(key);
    if (current === 1) {
      await redisClient.expire(key, windowSecs);
    }
    
    return current <= limit;
  } catch (error) {
    // Fall open on Redis failure
    return true;
  }
};

/**
 * Checks connection rate limit by IP.
 */
export const checkConnectionRateLimit = async (ip: string, limit: number = 5, windowSecs: number = 60): Promise<boolean> => {
  const key = `ws:conn:${ip}`;
  
  try {
    const current = await redisClient.incr(key);
    if (current === 1) {
      await redisClient.expire(key, windowSecs);
    }
    
    return current <= limit;
  } catch (error) {
    return true;
  }
};
