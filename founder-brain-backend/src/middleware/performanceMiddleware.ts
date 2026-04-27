import { Request, Response, NextFunction } from 'express';
import responseTime from 'response-time';
import { ILogger } from '../interfaces/ILogger';

/**
 * Performance monitoring middleware.
 */
export const performanceMiddleware = (logger: ILogger) => {
  return responseTime((req: Request, res: Response, time: number) => {
    const url = req.originalUrl || req.url;
    const method = req.method;
    const status = res.statusCode;

    // Log slow requests
    if (time > 1000) {
      logger.error(`CRITICAL SLOW REQUEST: ${method} ${url} took ${time.toFixed(2)}ms`, { status });
    } else if (time > 200) {
      logger.warn(`SLOW REQUEST: ${method} ${url} took ${time.toFixed(2)}ms`, { status });
    } else {
      logger.debug(`${method} ${url} took ${time.toFixed(2)}ms`, { status });
    }
  });
};
