import { Request, Response, NextFunction } from 'express';
import { ICacheService } from '../interfaces/ICacheService';
import { getTTLForEndpoint } from '../config/cacheConfig';

/**
 * Generates a unique cache key for a request.
 */
const generateCacheKey = (req: Request): string => {
  const userId = req.query.userId || 'anonymous'; // Simplification for hackathon
  const path = req.originalUrl || req.url;
  return `page:${req.method}:${userId}:${path}`;
};

/**
 * Cache middleware factory.
 */
export const cacheMiddleware = (cacheService: ICacheService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache if Cache-Control: no-cache is present
    if (req.header('Cache-Control') === 'no-cache') {
      return next();
    }

    const key = generateCacheKey(req);

    try {
      const cachedResponse = await cacheService.get<any>(key);

      if (cachedResponse) {
        const ttl = await cacheService.ttl(key);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-TTL', ttl.toString());
        return res.status(200).json(cachedResponse);
      }

      // Cache MISS - Monkey patch res.json to capture response
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const ttl = getTTLForEndpoint(req.baseUrl + req.path);
          cacheService.set(key, body, ttl).catch(err => {
             // Non-blocking error
          });
        }
        
        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };

      next();
    } catch (error) {
      // Fallback to next middleware on error
      next();
    }
  };
};
