import { redisClient } from '../config/redis';
import { ILogger } from '../interfaces/ILogger';

export class RateLimitMonitoringService {
  constructor(private logger: ILogger) {}

  /**
   * Tracks a rate limit violation block in Redis.
   */
  async trackViolation(ip: string, endpoint: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const violationKey = `ratelimit:violations:${today}`;
    const blockKey = `ratelimit:blocked:${ip}`;
    const countKey = `ratelimit:count:${ip}`;

    try {
      // Increment total violation count for this IP
      await redisClient.zincrby(violationKey, 1, ip);
      
      // Increment rolling 5-minute counter
      const recentViolations = await redisClient.incr(countKey);
      if (recentViolations === 1) {
        await redisClient.expire(countKey, 300); // 5 minutes window
      }

      // Log violation
      this.logger.warn(`Rate limit exceeded for IP ${ip} on endpoint ${endpoint}. Recent violations: ${recentViolations}`);

      // Temporary block if > 10 violations in 5 minutes
      if (recentViolations >= 10) {
        await redisClient.set(blockKey, '1', 'EX', 3600); // Block for 1 hour
        this.logger.warn(`IP ${ip} temporarily blocked for 1 hour due to excessive rate limit violations.`);
        return true; // Indicates IP was just blocked
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to track rate limit violation', { error, ip, endpoint });
      return false;
    }
  }

  /**
   * Checks if an IP is currently blocked.
   */
  async isIpBlocked(ip: string): Promise<boolean> {
    try {
      const isBlocked = await redisClient.get(`ratelimit:blocked:${ip}`);
      return !!isBlocked;
    } catch (error) {
      this.logger.error('Failed to check IP block status', { error, ip });
      return false; // Fall open on Redis error
    }
  }
}
