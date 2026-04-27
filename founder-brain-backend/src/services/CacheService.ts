import { Redis } from 'ioredis';
import { ICacheService } from '../interfaces/ICacheService';
import { ILogger } from '../interfaces/ILogger';

export class CacheService implements ICacheService {
  private circuitBreakerCount = 0;
  private readonly MAX_FAILURES = 3;

  constructor(
    private redis: Redis,
    private logger: ILogger
  ) {}

  private isRedisHeathy(): boolean {
    if (this.circuitBreakerCount >= this.MAX_FAILURES) {
      if (Math.random() > 0.9) return true; // Try 10% of requests to recover
      return false;
    }
    return true;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isRedisHeathy()) return null;

    try {
      const data = await this.redis.get(key);
      if (!data) {
        this.logger.debug(`Cache MISS: ${key}`);
        return null;
      }
      this.logger.debug(`Cache HIT: ${key}`);
      this.circuitBreakerCount = 0;
      return JSON.parse(data) as T;
    } catch (error) {
      this.handleError(error, 'get');
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.isRedisHeathy()) return;

    try {
      const data = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.set(key, data, 'EX', ttlSeconds);
      } else {
        await this.redis.set(key, data);
      }
      this.circuitBreakerCount = 0;
    } catch (error) {
      this.handleError(error, 'set');
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.handleError(error, 'del');
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Invalidated ${keys.length} keys with pattern: ${pattern}`);
      }
    } catch (error) {
      this.handleError(error, 'delPattern');
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await this.redis.exists(key)) === 1;
    } catch (error) {
      this.handleError(error, 'exists');
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      return -1;
    }
  }

  async increment(key: string, amount = 1): Promise<number> {
    try {
      return await this.redis.incrby(key, amount);
    } catch (error) {
      return 0;
    }
  }

  async flushAll(): Promise<void> {
    try {
      await this.redis.flushall();
      this.logger.info('Cache flushed (ALL KEYS)');
    } catch (error) {
      this.handleError(error, 'flushAll');
    }
  }

  async getKeys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      return [];
    }
  }

  private handleError(error: any, operation: string): void {
    this.circuitBreakerCount++;
    this.logger.warn(`Redis Cache Error [${operation}]:`, { 
      message: error.message, 
      failures: this.circuitBreakerCount 
    });
  }
}
