export interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyGenerator?: (req: any) => string;
}

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface AbusePattern {
  ip: string;
  violations: number;
  blockedUntil: Date;
}
