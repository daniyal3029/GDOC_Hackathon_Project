import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import RedisMock from 'ioredis-mock';

let mongoServer: MongoMemoryServer;

// Set test environment
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123',
}));

// Mock ESM dependencies
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn(),
}));

jest.mock('@lancedb/lancedb', () => ({
  connect: jest.fn(),
}));

// Mock performance-heavy or problematic middleware
jest.mock('../../src/middleware/performanceMiddleware', () => ({
  performanceMiddleware: () => (req: any, res: any, next: any) => next(),
}));

jest.mock('../../src/middleware/requestTracer', () => ({
  requestTracerMiddleware: (req: any, res: any, next: any) => next(),
}));

// Mock Rate Limiters to pass through in tests
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

// Mock Redis module
const mockRedis = new RedisMock();
jest.mock('../../src/config/redis', () => ({
  redisClient: mockRedis,
  disconnectRedis: jest.fn().mockResolvedValue(true),
}));

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  // Clear all database collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }

  // Clear Redis mock
  await mockRedis.flushall();

  // Clear all mocks
  jest.clearAllMocks();
});
