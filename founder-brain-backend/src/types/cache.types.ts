export interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
  compress?: boolean;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  memoryBytes: number;
}

export type InvalidationEntity = 'meeting' | 'task' | 'query' | 'notification';
export type InvalidationAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface InvalidationPattern {
  entity: InvalidationEntity;
  action: InvalidationAction;
  id?: string;
}
