import config from './environment';
import { PerformanceBudget } from '../types/monitoring.types';

export const monitoringConfig = {
  logging: {
    level: (process.env.LOG_LEVEL || 'info') as string,
    format: (process.env.LOG_FORMAT || 'json') as 'json' | 'simple',
    dir: process.env.LOG_DIR || './logs',
    maxSizeMB: parseInt(process.env.LOG_MAX_SIZE_MB || '100', 10),
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '7', 10),
    retentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '30', 10),
  },
  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    path: process.env.METRICS_PATH || '/metrics',
  },
  healthCheck: {
    intervalMs: parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || '30000', 10),
    timeoutMs: 5000,
  },
  alerts: {
    slackWebhookUrl: process.env.ALERT_SLACK_WEBHOOK_URL || '',
    onError: process.env.ALERT_ON_ERROR !== 'false',
    onSlowQueryMs: parseInt(process.env.ALERT_ON_SLOW_QUERY_MS || '5000', 10),
    deduplicationWindowMs: 5 * 60 * 1000, // 5 minutes
  },
  tracing: {
    headerName: process.env.TRACE_HEADER_NAME || 'x-request-id',
  },
  performanceBudgets: [
    { metric: 'api_response_time_p95', warning: 500, critical: 2000 },
    { metric: 'db_query_time', warning: 100, critical: 500 },
    { metric: 'openai_call_duration', warning: 3000, critical: 10000 },
    { metric: 'queue_processing_time', warning: 5000, critical: 30000 },
    { metric: 'error_rate_percent', warning: 1, critical: 5 },
  ] as PerformanceBudget[],
};
