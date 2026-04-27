import { Request, Response, NextFunction } from 'express';
import { httpRequestsTotal, httpErrorsTotal, httpRequestDuration } from '../monitoring/metrics/MetricsService';

/**
 * Middleware that records Prometheus metrics for every HTTP request:
 * - Total request count
 * - Error count (4xx/5xx)
 * - Request duration histogram
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip metrics endpoint itself to avoid recursion
  if (req.path === '/metrics') return next();

  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const durationNs = Number(process.hrtime.bigint() - startTime);
    const durationSec = durationNs / 1e9;

    // Normalize path to prevent cardinality explosion (replace IDs with :id)
    const normalizedPath = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : req.originalUrl.split('?')[0].replace(/\/[a-f0-9]{24}/g, '/:id');

    const labels = {
      method: req.method,
      path: normalizedPath,
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, durationSec);

    if (res.statusCode >= 400) {
      const errorType = res.statusCode >= 500 ? '5xx' : '4xx';
      httpErrorsTotal.inc({ method: req.method, path: normalizedPath, error_type: errorType });
    }
  });

  next();
};
