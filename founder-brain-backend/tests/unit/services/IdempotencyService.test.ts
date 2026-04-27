import { IdempotencyService } from '../../../src/services/IdempotencyService';

describe('IdempotencyService Unit Tests', () => {
  let idempotencyService: IdempotencyService;
  let mockRepo: any;
  let mockCache: any;
  let mockLogger: any;

  beforeEach(() => {
    mockRepo = {
      findByKey: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
    };
    mockCache = {
        get: jest.fn(),
        set: jest.fn(),
    };
    mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

    idempotencyService = new IdempotencyService(mockRepo, mockCache, mockLogger);
  });

  describe('isValidKey', () => {
    it('should return true for valid UUID-like string', () => {
      expect(idempotencyService.isValidKey('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    });

    it('should return false for invalid format', () => {
      expect(idempotencyService.isValidKey('short')).toBe(false);
    });
  });

  describe('process', () => {
    it('should return cached result if found in cache', async () => {
      const cachedResponse = { data: 'old' };
      mockCache.get.mockResolvedValue(cachedResponse);

      const result = await idempotencyService.process('key-123', {} as any, jest.fn());

      expect(result.fromCache).toBe(true);
      expect(result.response).toEqual(cachedResponse);
      expect(mockCache.get).toHaveBeenCalled();
    });
  });
});
