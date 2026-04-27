import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../../config/redis';
import { rateLimitRules } from '../../config/rateLimitConfig';
import { container } from '../../config/container';
import { Request, Response, NextFunction } from 'express';

const getMonitoringService = () => {
  // Lazy load to avoid circular dependencies during initialization
  try {
    return container.resolve<any>('RateLimitMonitoringService');
  } catch (e) {
    return null;
  }
};

/**
 * Global rate limiter middleware for all endpoints.
 */
export const globalRateLimiter = rateLimit({
  windowMs: rateLimitRules.global.windowMs,
  max: rateLimitRules.global.max,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: new RedisStore({
    sendCommand: (...args: string[]) => (redisClient as any).call(...args),
    prefix: 'ratelimit:global:',
  }),
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Global rate limit exceeded. Try again later.'
  },
  skip: (req: Request) => {
    // Skip health checks and metrics
    if (['/health', '/metrics', '/readiness'].includes(req.path)) {
      return true;
    }
    // Skip internal IPs if provided
    return false;
  },
  handler: async (req: Request, res: Response, next: NextFunction, options: any) => {
    const monitoringService = getMonitoringService();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    
    if (monitoringService) {
      const isBlocked = await monitoringService.trackViolation(ip, 'global');
      if (isBlocked) {
        return res.status(403).json({ success: false, error: 'Forbidden', message: 'Temporarily blocked due to abuse' });
      }
    }
    
    res.status(options.statusCode).send(options.message);
  }
});

/**
 * Middleware to explicitly check the IP block list before any other logic.
 */
export const blockListCheck = async (req: Request, res: Response, next: NextFunction) => {
  const monitoringService = getMonitoringService();
  if (!monitoringService) return next();

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const isBlocked = await monitoringService.isIpBlocked(ip);

  if (isBlocked) {
    return res.status(403).json({ success: false, error: 'Forbidden', message: 'Temporarily blocked due to abuse' });
  }

  next();
};
