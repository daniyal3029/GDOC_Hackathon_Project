import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';
import logger from '../config/logger';
import fs from 'fs';
import path from 'path';
import { monitoringConfig } from '../config/monitoringConfig';

const QUEUE_NAME = 'maintenance-queue';
const JOB_NAME = 'log-cleanup';

export const logCleanupQueue = new Queue(QUEUE_NAME, {
  connection: redisClient
});

/**
 * Ensures old log files are cleaned up if rotation missed any.
 */
export const startLogCleanupWorker = () => {
  const worker = new Worker(QUEUE_NAME, async (job: Job) => {
    if (job.name === JOB_NAME) {
      logger.info('Starting manual log cleanup scan...');
      
      const logDir = monitoringConfig.logging.dir;
      const retentionDays = monitoringConfig.logging.retentionDays || 30;
      const now = Date.now();
      
      try {
        if (!fs.existsSync(logDir)) return;
        
        const files = fs.readdirSync(logDir);
        let deletedCount = 0;
        
        for (const file of files) {
          const filePath = path.join(logDir, file);
          const stats = fs.statSync(filePath);
          const ageDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
          
          if (ageDays > retentionDays) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
        
        logger.info(`Log cleanup completed. Deleted ${deletedCount} files older than ${retentionDays} days.`);
        
      } catch (error: any) {
        logger.error('Failed to run log cleanup', { error: error.message });
      }
    }
  }, { connection: redisClient });

  return worker;
};

/**
 * Schedule the log cleanup job to run weekly.
 */
export const scheduleLogCleanupJob = async () => {
  const repeatableJobs = await logCleanupQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.name === JOB_NAME) {
      await logCleanupQueue.removeRepeatableByKey(job.key);
    }
  }

  // Run at 2 AM every Sunday
  await logCleanupQueue.add(JOB_NAME, {}, {
    repeat: {
      pattern: '0 2 * * 0'
    }
  });
  
  logger.info('Scheduled weekly log cleanup on Sundays at 02:00 AM');
};
