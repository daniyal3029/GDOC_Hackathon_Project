import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';
import { register } from '../monitoring/metrics/MetricsService';
import { DailyMetric } from '../models/DailyMetric';
import logger from '../config/logger';

const QUEUE_NAME = 'maintenance-queue';
const JOB_NAME = 'metrics-aggregation';

export const metricsQueue = new Queue(QUEUE_NAME, {
  connection: redisClient
});

/**
 * Aggregates and snapshots Prometheus metrics into MongoDB.
 */
export const startMetricsAggregationWorker = () => {
  const worker = new Worker(QUEUE_NAME, async (job: Job) => {
    if (job.name === JOB_NAME) {
      logger.info('Starting daily metrics aggregation...');
      
      try {
        const metricsStr = await register.getMetricsAsJSON();
        const metricsData = JSON.parse(JSON.stringify(metricsStr)); // Deep copy/ensure object
        
        // Find specific metrics we care about
        const findMetric = (name: string) => metricsData.find((m: any) => m.name === name);
        
        const requests = findMetric('http_requests_total');
        const errors = findMetric('http_errors_total');
        const duration = findMetric('http_request_duration_seconds');
        const openaiTokens = findMetric('openai_tokens_per_request');
        
        // Calculate totals
        const totalRequests = requests?.values.reduce((sum: number, v: any) => sum + v.value, 0) || 0;
        const totalErrors = errors?.values.reduce((sum: number, v: any) => sum + v.value, 0) || 0;
        const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
        
        // This is a simplified snapshot. In a production env, 
        // you'd query Prometheus/Grafana API for time-range data.
        const snapshot = new DailyMetric({
          date: new Date(),
          metrics: {
            totalRequests,
            errorRate,
            p95ResponseTimeMs: 0, // Simplified for snapshots
            openaiTokens: 0, // Would need extraction from Summary
            openaiCost: 0,
            meetingsProcessed: 0,
            tasksCompleted: 0
          },
          details: {
            rawMetrics: metricsData
          }
        });
        
        await snapshot.save();
        logger.info('Daily metrics aggregation completed and stored in MongoDB.');
        
      } catch (error: any) {
        logger.error('Failed to aggregate metrics', { error: error.message });
        throw error;
      }
    }
  }, { connection: redisClient });

  return worker;
};

/**
 * Schedule the metrics aggregation job to run daily.
 */
export const scheduleMetricsAggregationJob = async () => {
  const repeatableJobs = await metricsQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.name === JOB_NAME) {
      await metricsQueue.removeRepeatableByKey(job.key);
    }
  }

  // Run at 1 AM daily
  await metricsQueue.add(JOB_NAME, {}, {
    repeat: {
      pattern: '0 1 * * *'
    }
  });
  
  logger.info('Scheduled daily metrics aggregation at 01:00 AM');
};
