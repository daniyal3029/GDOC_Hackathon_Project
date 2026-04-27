import mongoose from 'mongoose';
import { dbQueryDuration } from './MetricsService';
import logger from '../../config/logger';
import { monitoringConfig } from '../../config/monitoringConfig';

/**
 * Enables database query duration tracking via Mongoose middleware.
 * Uses middleware hooks rather than schema plugin for broader compatibility.
 */
export const enableDatabaseMetrics = () => {
  const slowQueryThresholdMs = monitoringConfig.alerts.onSlowQueryMs || 5000;

  // Use mongoose connection events for basic monitoring
  mongoose.connection.on('commandStarted', (event: any) => {
    // Store start time mapped by request ID
    (mongoose.connection as any)._metricsTimers = (mongoose.connection as any)._metricsTimers || {};
    (mongoose.connection as any)._metricsTimers[event.requestId] = Date.now();
  });

  mongoose.connection.on('commandSucceeded', (event: any) => {
    const timers = (mongoose.connection as any)._metricsTimers;
    if (timers && timers[event.requestId]) {
      const durationMs = Date.now() - timers[event.requestId];
      delete timers[event.requestId];

      const collection = event.address || 'unknown';
      const operation = event.commandName || 'unknown';
      dbQueryDuration.observe({ collection, operation }, durationMs / 1000);

      if (durationMs > slowQueryThresholdMs) {
        logger.warn('SLOW QUERY detected', {
          operation,
          durationMs,
          commandName: event.commandName,
        });
      }
    }
  });

  mongoose.connection.on('commandFailed', (event: any) => {
    const timers = (mongoose.connection as any)._metricsTimers;
    if (timers && timers[event.requestId]) {
      const durationMs = Date.now() - timers[event.requestId];
      delete timers[event.requestId];

      logger.error('Database command failed', {
        operation: event.commandName,
        durationMs,
        failure: event.failure?.message,
      });
    }
  });

  logger.info('Database metrics collection enabled');
};
