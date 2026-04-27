import { Request } from 'express';
import { IdempotencyResult } from '../types/idempotency.types';

export interface IIdempotencyService {
  process<T>(
    key: string,
    req: Request,
    processor: () => Promise<T>
  ): Promise<IdempotencyResult<T>>;
  
  isValidKey(key: string): boolean;
  generateKey(): string;
  getStats(): Promise<any>;
}
