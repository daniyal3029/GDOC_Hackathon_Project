import client from 'prom-client';

// Use default registry
const register = client.register;

// Collect default Node.js metrics (event loop lag, memory, GC, etc.)
client.collectDefaultMetrics({ register, prefix: 'founder_brain_' });

// ─── HTTP Metrics ───
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status_code'],
});

export const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors (4xx and 5xx)',
  labelNames: ['method', 'path', 'error_type'],
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
});

// ─── OpenAI / AI Metrics ───
export const openaiCallsTotal = new client.Counter({
  name: 'openai_calls_total',
  help: 'Total OpenAI/Gemini API calls',
  labelNames: ['model', 'status'],
});

export const openaiCallDuration = new client.Histogram({
  name: 'openai_call_duration_seconds',
  help: 'OpenAI/Gemini API call duration in seconds',
  labelNames: ['model'],
  buckets: [0.5, 1, 2, 5, 10, 20, 30],
});

export const openaiTokensUsed = new client.Summary({
  name: 'openai_tokens_per_request',
  help: 'Tokens used per OpenAI/Gemini request',
  labelNames: ['model'],
  percentiles: [0.5, 0.9, 0.99],
});

// ─── Database Metrics ───
export const dbQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['collection', 'operation'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
});

// ─── Business Metrics ───
export const meetingsProcessedTotal = new client.Counter({
  name: 'meetings_processed_total',
  help: 'Total meetings processed',
  labelNames: ['status'],
});

export const tasksCompletedTotal = new client.Counter({
  name: 'tasks_completed_total',
  help: 'Total tasks completed',
  labelNames: ['owner'],
});

// ─── BullMQ Queue Metrics ───
export const bullmqActiveJobs = new client.Gauge({
  name: 'bullmq_active_jobs',
  help: 'Number of active BullMQ jobs',
  labelNames: ['queue'],
});

export const bullmqWaitingJobs = new client.Gauge({
  name: 'bullmq_waiting_jobs',
  help: 'Number of waiting BullMQ jobs',
  labelNames: ['queue'],
});

export const bullmqFailedJobsTotal = new client.Counter({
  name: 'bullmq_failed_jobs_total',
  help: 'Total BullMQ failed jobs',
  labelNames: ['queue', 'reason'],
});

// ─── Infrastructure Metrics ───
export const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections (HTTP + WebSocket)',
  labelNames: ['type'],
});

export const circuitBreakerState = new client.Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=open, 2=half_open)',
  labelNames: ['service'],
});

export const cacheHitRatio = new client.Gauge({
  name: 'cache_hit_ratio',
  help: 'Cache hit ratio (0-1)',
});

export const vectorSearchDuration = new client.Histogram({
  name: 'vector_search_duration_seconds',
  help: 'Vector search query duration in seconds',
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2],
});

// ─── Performance Budget Violations ───
export const performanceBudgetViolations = new client.Counter({
  name: 'performance_budget_violations_total',
  help: 'Performance budget violations',
  labelNames: ['metric', 'severity'],
});

export { register };
