import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { redisClient } from '../config/redis';
import logger from '../config/logger';

/**
 * Health check handler to monitor service status.
 */
export const healthCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    let redisStatus = 'disconnected';
    if (redisClient.status === 'ready') {
      redisStatus = 'connected';
    }

    const healthStatus = {
      status: mongoStatus === 'connected' && redisStatus === 'connected' ? 'ok' : 'error',
      services: {
        mongodb: mongoStatus,
        redis: redisStatus,
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    if (healthStatus.status === 'error') {
      logger.warn('Health check failed', healthStatus);
      res.status(503).json(healthStatus);
      return;
    }

    res.status(200).json(healthStatus);
  } catch (error) {
    logger.error('Health check encountered an error', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during health check',
    });
  }
};

export default healthCheck;
