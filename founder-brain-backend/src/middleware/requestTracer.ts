import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requestContext } from '../monitoring/tracing/RequestTracer';
import { monitoringConfig } from '../config/monitoringConfig';
import logger from '../config/logger';

/**
 * Middleware that extracts or generates a trace ID for every request and
 * wraps the entire request lifecycle in an AsyncLocalStorage context.
 */
export const requestTracerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const headerName = monitoringConfig.tracing.headerName;
  const traceId = (req.headers[headerName] as string) ||
                  (req.headers['x-correlation-id'] as string) ||
                  uuidv4();

  // Set response header
  res.setHeader('X-Request-ID', traceId);

  // Run the rest of the middleware chain inside the async context
  requestContext.run(
    {
      traceId,
      userId: (req as any).userId || undefined,
      method: req.method,
      path: req.originalUrl,
      startTime: Date.now(),
    },
    () => {
      // Log access entry
      const startTime = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info('HTTP Request', {
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          responseTimeMs: duration,
          ip: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        });
      });

      next();
    }
  );
};
