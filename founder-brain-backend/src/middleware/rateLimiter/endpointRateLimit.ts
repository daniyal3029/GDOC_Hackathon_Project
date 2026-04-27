import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../../config/redis';
import { rateLimitRules } from '../../config/rateLimitConfig';
import { container } from '../../config/container';
import { Request, Response, NextFunction } from 'express';

const getMonitoringService = () => {
  try {
    return container.resolve<any>('RateLimitMonitoringService');
  } catch (e) {
    return null;
  }
};

const createLimiter = (config: any, prefix: string, endpointName: string) => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args: string[]) => (redisClient as any).call(...args),
      prefix: `ratelimit:${prefix}:`,
    }),
    message: {
      success: false,
      error: 'Too Many Requests',
      message: `Rate limit exceeded for endpoint ${endpointName}. Try again later.`,
    },
    handler: async (req: Request, res: Response, next: NextFunction, options: any) => {
      const monitoringService = getMonitoringService();
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      
      if (monitoringService) {
        const isBlocked = await monitoringService.trackViolation(ip, endpointName);
        if (isBlocked) {
          return res.status(403).json({ success: false, error: 'Forbidden', message: 'Temporarily blocked due to abuse' });
        }
      }
      
      res.status(options.statusCode).send(options.message);
    }
  });
};

export const meetingProcessLimiter = createLimiter(rateLimitRules.meetingProcess, 'meetingProcess', 'Meeting Process');
export const queryLimiter = createLimiter(rateLimitRules.query, 'query', 'Query');
export const queryStreamLimiter = createLimiter(rateLimitRules.queryStream, 'queryStream', 'Query Stream');
export const taskCompleteLimiter = createLimiter(rateLimitRules.taskComplete, 'taskComplete', 'Task Complete');
export const readEndpointsLimiter = createLimiter(rateLimitRules.reads, 'reads', 'Read Endpoints');
