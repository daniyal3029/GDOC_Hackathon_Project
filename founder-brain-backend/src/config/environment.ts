import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

/**
 * Interface representing the environment configuration.
 */
interface Config {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  REDIS_URL: string;
  LOG_LEVEL: string;
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  VECTOR_DB_PATH: string;
  EMBEDDING_MODEL: string;
  EMBEDDING_DIMENSION: number;
  USE_LOCAL_EMBEDDINGS: boolean;
  MAX_CONTEXT_CHUNKS: number;
  MAX_CONTEXT_TOKENS: number;
  SIMILARITY_THRESHOLD: number;
  QUEUE_RETRY_ATTEMPTS: number;
  QUEUE_RETRY_DELAY: number;
  MAX_CONCURRENT_JOBS: number;
  
  // Phase 5
  SOCKET_PORT: number;
  SOCKET_PATH: string;
  CORS_ORIGIN: string;
  NOTIFICATION_RETENTION_DAYS: number;
  MAX_ROOM_SIZE: number;

  // Phase 6
  CACHE_TTL_MEETING: number;
  CACHE_TTL_MEETING_LIST: number;
  CACHE_TTL_TASK_LIST: number;
  CACHE_TTL_QUERY_RESULTS: number;
  CACHE_TTL_PENDING_TASKS: number;
  CACHE_MAX_KEYS: number;
  CACHE_MAX_BYTES: number;
  SLOW_QUERY_THRESHOLD_MS: number;
  ENABLE_QUERY_METRICS: boolean;
  COMPRESSION_LEVEL: number;

  // Phase 7
  IDEMPOTENCY_TTL_SECONDS: number;
  IDEMPOTENCY_MAX_PAYLOAD_SIZE: number;
  IDEMPOTENCY_CLEANUP_CRON: string;
  MONGODB_TRANSACTION_TIMEOUT_MS: number;

  // Phase 8
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  RATE_LIMIT_MEETING_PROCESS: number;
  RATE_LIMIT_QUERY: number;
  RATE_LIMIT_TASK_COMPLETE: number;
  RATE_LIMIT_USER_DAILY: number;
  OPENAI_MAX_CONCURRENT: number;
  OPENAI_QUEUE_TIMEOUT_MS: number;
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: number;
  CIRCUIT_BREAKER_TIMEOUT_MS: number;
  CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS: number;
  ENABLE_HELMET: boolean;
  MAX_REQUEST_SIZE_MB: number;

  // Phase 10
  SWAGGER_ENABLED: boolean;
  SWAGGER_PATH: string;
  API_TITLE: string;
  API_DESCRIPTION: string;
  API_VERSION: string;
  API_SERVER_URL: string;

  // Phase 13 - Auth
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRY: number;
  JWT_REFRESH_EXPIRY: number;
  BCRYPT_ROUNDS: number;
  COOKIE_SECURE: boolean;
  COOKIE_HTTP_ONLY: boolean;
  COOKIE_SAME_SITE: 'lax' | 'strict' | 'none';
  COOKIE_DOMAIN: string;
  CSRF_SECRET: string;
}

/**
 * Validates that all required environment variables are present.
 */
export const validateEnv = (): Config => {
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'REDIS_URL',
    'LOG_LEVEL',
    'GEMINI_API_KEY',
    'OPENAI_API_KEY',
  ];

  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    const errorMsg = `Missing environment variables: ${missingEnvVars.join(', ')}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  return {
    NODE_ENV: process.env.NODE_ENV as string,
    PORT: parseInt(process.env.PORT as string, 10),
    MONGODB_URI: process.env.MONGODB_URI as string,
    REDIS_URL: process.env.REDIS_URL as string,
    LOG_LEVEL: process.env.LOG_LEVEL as string,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY as string,
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY as string,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o',
    VECTOR_DB_PATH: process.env.VECTOR_DB_PATH || './data/lancedb',
    EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    EMBEDDING_DIMENSION: parseInt(process.env.EMBEDDING_DIMENSION || '1536', 10),
    USE_LOCAL_EMBEDDINGS: process.env.USE_LOCAL_EMBEDDINGS === 'true',
    MAX_CONTEXT_CHUNKS: parseInt(process.env.MAX_CONTEXT_CHUNKS || '5', 10),
    MAX_CONTEXT_TOKENS: parseInt(process.env.MAX_CONTEXT_TOKENS || '4000', 10),
    SIMILARITY_THRESHOLD: parseFloat(process.env.SIMILARITY_THRESHOLD || '0.7'),
    QUEUE_RETRY_ATTEMPTS: parseInt(process.env.QUEUE_RETRY_ATTEMPTS || '3', 10),
    QUEUE_RETRY_DELAY: parseInt(process.env.QUEUE_RETRY_DELAY || '5000', 10),
    MAX_CONCURRENT_JOBS: parseInt(process.env.MAX_CONCURRENT_JOBS || '5', 10),
    
    SOCKET_PORT: parseInt(process.env.SOCKET_PORT || process.env.PORT || '3001', 10),
    SOCKET_PATH: process.env.SOCKET_PATH || '/socket.io',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
    NOTIFICATION_RETENTION_DAYS: parseInt(process.env.NOTIFICATION_RETENTION_DAYS || '30', 10),
    MAX_ROOM_SIZE: parseInt(process.env.MAX_ROOM_SIZE || '100', 10),

    // Phase 6
    CACHE_TTL_MEETING: parseInt(process.env.CACHE_TTL_MEETING || '3600', 10),
    CACHE_TTL_MEETING_LIST: parseInt(process.env.CACHE_TTL_MEETING_LIST || '300', 10),
    CACHE_TTL_TASK_LIST: parseInt(process.env.CACHE_TTL_TASK_LIST || '60', 10),
    CACHE_TTL_QUERY_RESULTS: parseInt(process.env.CACHE_TTL_QUERY_RESULTS || '900', 10),
    CACHE_TTL_PENDING_TASKS: parseInt(process.env.CACHE_TTL_PENDING_TASKS || '30', 10),
    CACHE_MAX_KEYS: parseInt(process.env.CACHE_MAX_KEYS || '10000', 10),
    CACHE_MAX_BYTES: parseInt(process.env.CACHE_MAX_BYTES || '524288000', 10),
    SLOW_QUERY_THRESHOLD_MS: parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '100', 10),
    ENABLE_QUERY_METRICS: process.env.ENABLE_QUERY_METRICS !== 'false',
    COMPRESSION_LEVEL: parseInt(process.env.COMPRESSION_LEVEL || '6', 10),

    // Phase 7
    IDEMPOTENCY_TTL_SECONDS: parseInt(process.env.IDEMPOTENCY_TTL_SECONDS || '86400', 10),
    IDEMPOTENCY_MAX_PAYLOAD_SIZE: parseInt(process.env.IDEMPOTENCY_MAX_PAYLOAD_SIZE || '102400', 10),
    IDEMPOTENCY_CLEANUP_CRON: process.env.IDEMPOTENCY_CLEANUP_CRON || '0 2 * * *',
    MONGODB_TRANSACTION_TIMEOUT_MS: parseInt(process.env.MONGODB_TRANSACTION_TIMEOUT_MS || '10000', 10),

    // Phase 8
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    RATE_LIMIT_MEETING_PROCESS: parseInt(process.env.RATE_LIMIT_MEETING_PROCESS || '10', 10),
    RATE_LIMIT_QUERY: parseInt(process.env.RATE_LIMIT_QUERY || '20', 10),
    RATE_LIMIT_TASK_COMPLETE: parseInt(process.env.RATE_LIMIT_TASK_COMPLETE || '50', 10),
    RATE_LIMIT_USER_DAILY: parseInt(process.env.RATE_LIMIT_USER_DAILY || '1000', 10),
    OPENAI_MAX_CONCURRENT: parseInt(process.env.OPENAI_MAX_CONCURRENT || '5', 10),
    OPENAI_QUEUE_TIMEOUT_MS: parseInt(process.env.OPENAI_QUEUE_TIMEOUT_MS || '30000', 10),
    CIRCUIT_BREAKER_FAILURE_THRESHOLD: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || '5', 10),
    CIRCUIT_BREAKER_TIMEOUT_MS: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT_MS || '60000', 10),
    CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS: parseInt(process.env.CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS || '3', 10),
    ENABLE_HELMET: process.env.ENABLE_HELMET !== 'false',
    MAX_REQUEST_SIZE_MB: parseInt(process.env.MAX_REQUEST_SIZE_MB || '10', 10),

    // Phase 10
    SWAGGER_ENABLED: process.env.SWAGGER_ENABLED !== 'false',
    SWAGGER_PATH: process.env.SWAGGER_PATH || '/api-docs',
    API_TITLE: process.env.API_TITLE || 'Founder Brain API',
    API_DESCRIPTION: process.env.API_DESCRIPTION || 'Meeting Intelligence with AI-powered task extraction',
    API_VERSION: process.env.API_VERSION || 'v1',
    API_SERVER_URL: process.env.API_SERVER_URL || 'http://localhost:3000',

    // Phase 13 - Auth
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'fallback-access-secret-replace-in-prod',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-replace-in-prod',
    JWT_ACCESS_EXPIRY: parseInt(process.env.JWT_ACCESS_EXPIRY || '900', 10),
    JWT_REFRESH_EXPIRY: parseInt(process.env.JWT_REFRESH_EXPIRY || '604800', 10),
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
    COOKIE_HTTP_ONLY: process.env.COOKIE_HTTP_ONLY !== 'false',
    COOKIE_SAME_SITE: (process.env.COOKIE_SAME_SITE as any) || 'lax',
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'localhost',
    CSRF_SECRET: process.env.CSRF_SECRET || 'fallback-csrf-secret-replace-in-prod',
  };
};

export const config = validateEnv();
export default config;
