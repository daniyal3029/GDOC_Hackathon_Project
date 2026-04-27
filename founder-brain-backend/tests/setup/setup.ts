import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import RedisMock from 'ioredis-mock';

let replSet: MongoMemoryReplSet;

// Set test environment
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';

// 1. Mock problematic modules BEFORE anything else
jest.mock('uuid', () => ({
  v4: () => '123e4567-e89b-12d3-a456-426614174000',
  validate: (val: string) => {
    return val.length === 36; // Simple loose validation for mock
  },
}));

jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn(),
}));

jest.mock('@lancedb/lancedb', () => ({
  connect: jest.fn(),
}));

jest.mock('response-time', () => {
  return jest.fn(() => (req: any, res: any, next: any) => next());
});

// Mock Redis
const mockRedis = new RedisMock();
jest.mock('../../src/config/redis', () => ({
  redisClient: mockRedis,
  disconnectRedis: jest.fn().mockResolvedValue(true),
}));

// Mock the rate limiter middleware totally
jest.mock('../../src/middleware/rateLimiter/globalRateLimit', () => ({
  globalRateLimiter: (req: any, res: any, next: any) => next(),
  blockListCheck: (req: any, res: any, next: any) => next(),
}));

jest.mock('../../src/middleware/rateLimiter/endpointRateLimit', () => ({
  meetingProcessLimiter: (req: any, res: any, next: any) => next(),
  readEndpointsLimiter: (req: any, res: any, next: any) => next(),
  queryLimiter: (req: any, res: any, next: any) => next(),
  taskCompleteLimiter: (req: any, res: any, next: any) => next(),
}));

// Mock tracing/performance
jest.mock('../../src/middleware/performanceMiddleware', () => ({
  performanceMiddleware: () => (req: any, res: any, next: any) => next(),
}));

jest.mock('../../src/middleware/requestTracer', () => ({
  requestTracerMiddleware: (req: any, res: any, next: any) => next(),
}));

beforeAll(async () => {
  // Use MongoMemoryReplSet to support Transactions
  replSet = await MongoMemoryReplSet.create({ replSet: { storageEngine: 'wiredTiger' } });
  const uri = replSet.getUri();
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.close();
  if (replSet) {
    await replSet.stop();
  }
});

beforeEach(async () => {
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
  await mockRedis.flushall();
  jest.clearAllMocks();
});
