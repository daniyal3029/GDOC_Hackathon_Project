import { CacheService } from '../../../src/services/CacheService';

describe('CacheService Unit Tests', () => {
  let cacheService: CacheService;
  let mockRedis: any;
  let mockLogger: any;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      exists: jest.fn(),
      flushall: jest.fn(),
    };
    mockLogger = { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() };

    cacheService = new CacheService(mockRedis, mockLogger);
  });

  describe('get', () => {
    it('should return parsed JSON from cache', async () => {
      const data = { foo: 'bar' };
      mockRedis.get.mockResolvedValue(JSON.stringify(data));

      const result = await cacheService.get('test-key');

      expect(result).toEqual(data);
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null if not in cache', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set data in cache with TTL', async () => {
      const data = { abc: 123 };
      await cacheService.set('test-key', data, 3600);

      expect(mockRedis.set).toHaveBeenCalledWith('test-key', JSON.stringify(data), 'EX', 3600);
    });
  });

  describe('del', () => {
    it('should delete key from cache', async () => {
      await cacheService.del('test-key');
      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });
  });
});
