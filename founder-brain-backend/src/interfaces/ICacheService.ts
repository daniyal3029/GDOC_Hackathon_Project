export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  delPattern(pattern: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  ttl(key: string): Promise<number>;
  increment(key: string, amount?: number): Promise<number>;
  flushAll(): Promise<void>;
  getKeys(pattern: string): Promise<string[]>;
}
