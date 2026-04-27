import { Request, Response, NextFunction } from 'express';
import { IIdempotencyService } from '../interfaces/IIdempotencyService';
import logger from '../config/logger';

/**
 * Middleware to enforce idempotency on write operations.
 */
export const idempotencyMiddleware = (idempotencyService: IIdempotencyService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only apply to write operations
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Extract key from headers
    const key = (req.header('Idempotency-Key') || req.header('X-Idempotency-Key')) as string;

    if (!key) {
      return res.status(400).json({
        error: 'Idempotency-Key header required for write operations.',
        message: 'Please provide a unique UUID v4 key in Idempotency-Key header.'
      });
    }

    if (!idempotencyService.isValidKey(key)) {
      return res.status(400).json({
        error: 'Invalid Idempotency-Key format.',
        message: 'Idempotency-Key must be a valid UUID v4.'
      });
    }

    res.setHeader('Idempotency-Key', key);

    // This is a simplified middleware. 
    // The actual "processor" wrapping happens inside the services or controllers
    // because we need access to the business logic result.
    // Here we just set a flag for the controllers to know they should use idempotency.
    (req as any).idempotencyKey = key;
    
    next();
  };
};
