import config from './environment';
import { RateLimitConfig } from '../types/rateLimit.types';

/**
 * Centralized Rate Limit Rules.
 */
export const rateLimitRules = {
  // Tier 1: Global limits (everyone)
  global: {
    windowMs: config.RATE_LIMIT_WINDOW_MS || 60000, // 1 minute
    max: config.RATE_LIMIT_MAX_REQUESTS || 100,
  } as RateLimitConfig,

  // Tier 2: Endpoint-specific limits
  meetingProcess: {
    windowMs: 60000, // 1 minute
    max: config.RATE_LIMIT_MEETING_PROCESS || 10,
  } as RateLimitConfig,

  query: {
    windowMs: 60000, // 1 minute
    max: config.RATE_LIMIT_QUERY || 20,
  } as RateLimitConfig,
  
  queryStream: {
    windowMs: 60000, // 1 minute
    max: Math.floor((config.RATE_LIMIT_QUERY || 20) / 2),
  } as RateLimitConfig,

  taskComplete: {
    windowMs: 60000, // 1 minute
    max: config.RATE_LIMIT_TASK_COMPLETE || 50,
  } as RateLimitConfig,

  // Read endpoints (cached, cheap)
  reads: {
    windowMs: 60000, // 1 minute
    max: 200, // High limit for DDoS protection
  } as RateLimitConfig,

  // Tier 3: User-based limits (if authenticated)
  userDaily: {
    windowMs: 24 * 60 * 60 * 1000, // 1 day
    max: config.RATE_LIMIT_USER_DAILY || 1000,
  } as RateLimitConfig,
};
