import { Request } from 'express';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';
import { IIdempotencyService } from '../interfaces/IIdempotencyService';
import { IdempotencyRepository } from '../repositories/IdempotencyRepository';
import { ICacheService } from '../interfaces/ICacheService';
import { ILogger } from '../interfaces/ILogger';
import { IdempotencyResult } from '../types/idempotency.types';
import config from '../config/environment';

export class IdempotencyService implements IIdempotencyService {
  private readonly REDIS_PREFIX = 'idempotency:';

  constructor(
    private repository: IdempotencyRepository,
    private cacheService: ICacheService,
    private logger: ILogger
  ) {}

  async process<T>(
    key: string,
    req: Request,
    processor: () => Promise<T>
  ): Promise<IdempotencyResult<T>> {
    const startTime = Date.now();

    // 1. Check Fast Cache (Redis)
    const cached = await this.cacheService.get<any>(`${this.REDIS_PREFIX}${key}`);
    if (cached) {
      this.logger.debug('Idempotency HIT (Redis)', { key });
      return { fromCache: true, status: 'completed', response: cached };
    }

    // 2. Check Database (MongoDB)
    const record = await this.repository.findByKey(key);
    if (record) {
      if (record.status === 'completed') {
        this.logger.debug('Idempotency HIT (MongoDB)', { key });
        // Backfill cache
        await this.cacheService.set(`${this.REDIS_PREFIX}${key}`, record.response?.body, config.IDEMPOTENCY_TTL_SECONDS);
        return { fromCache: true, status: 'completed', response: record.response?.body };
      }
      
      if (record.status === 'processing') {
        this.logger.warn('Concurrent request with same idempotency key', { key });
        return { fromCache: false, status: 'processing' };
      }

      if (record.status === 'failed') {
        this.logger.info('Retrying previously failed idempotent request', { key });
        // We allow retry of failed requests with same key
      }
    }

    // 3. Create 'processing' record
    const expiresAt = new Date(Date.now() + config.IDEMPOTENCY_TTL_SECONDS * 1000);
    
    try {
      if (!record) {
        await this.repository.create({
          key,
          status: 'processing',
          request: {
            method: req.method,
            path: req.path,
            body: req.body,
            headers: this.sanitizeHeaders(req.headers)
          },
          expiresAt
        });
      } else {
        await this.repository.updateStatus(key, 'processing');
      }
    } catch (error: any) {
      // Handle race condition where two requests create at same time
      if (error.code === 11000) {
        return { fromCache: false, status: 'processing' };
      }
      throw error;
    }

    // 4. Execute operation
    try {
      const result = await processor();
      const duration = Date.now() - startTime;

      // 5. Update to 'completed'
      await this.repository.updateStatus(key, 'completed', {
        response: {
          statusCode: 200, // Normalized for success
          body: result,
          headers: {}
        },
        processingDuration: duration
      });

      // Cache result
      await this.cacheService.set(`${this.REDIS_PREFIX}${key}`, result, config.IDEMPOTENCY_TTL_SECONDS);

      return { fromCache: false, status: 'completed', response: result };
    } catch (error: any) {
      this.logger.error('Idempotent operation failed', { key, error: error.message });
      
      await this.repository.updateStatus(key, 'failed', {
        error: { message: error.message, stack: error.stack }
      });

      return { fromCache: false, status: 'failed', error };
    }
  }

  isValidKey(key: string): boolean {
    return validateUuid(key);
  }

  generateKey(): string {
    return uuidv4();
  }

  async getStats(): Promise<any> {
    return await this.repository.getStats();
  }

  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const exclude = ['authorization', 'cookie', 'set-cookie'];
    
    for (const [key, value] of Object.entries(headers)) {
      if (!exclude.includes(key.toLowerCase())) {
        sanitized[key] = String(value);
      }
    }
    return sanitized;
  }
}
