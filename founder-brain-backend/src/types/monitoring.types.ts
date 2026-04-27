export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export type MetricType = 'counter' | 'histogram' | 'gauge' | 'summary';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface PerformanceBudget {
  metric: string;
  warning: number;
  critical: number;
}

export interface DependencyHealth {
  name: string;
  status: HealthStatus;
  responseTimeMs: number;
  message?: string;
  lastChecked: Date;
}

export interface SystemHealth {
  status: HealthStatus;
  uptime: number;
  version: string;
  dependencies: DependencyHealth[];
  timestamp: Date;
}

export interface AlertPayload {
  severity: AlertSeverity;
  title: string;
  message: string;
  service: string;
  environment: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
