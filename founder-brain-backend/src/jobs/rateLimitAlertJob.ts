import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';
import logger from '../config/logger';

const QUEUE_NAME = 'security-queue';
const JOB_NAME = 'rate-limit-abuse-scan';

export const securityQueue = new Queue(QUEUE_NAME, {
  connection: redisClient
});

/**
 * Cleanup and abuse detection worker for rate limiting.
 */
export const startSecurityWorker = () => {
  const worker = new Worker(QUEUE_NAME, async (job: Job) => {
    if (job.name === JOB_NAME) {
      logger.info('Starting rate limit abuse scan...');
      
      const today = new Date().toISOString().split('T')[0];
      const violationKey = `ratelimit:violations:${today}`;
      
      try {
        // Get top 10 violators
        const topViolators = await redisClient.zrevrange(violationKey, 0, 9, 'WITHSCORES');
        
        // Parse WITHSCORES result: [member1, score1, member2, score2, ...]
        for (let i = 0; i < topViolators.length; i += 2) {
          const ip = topViolators[i];
          const score = parseFloat(topViolators[i + 1]);
          if (score > 50) {
            // High threshold crossed across the whole day
            const blockKey = `ratelimit:blocked:${ip}`;
            
            const isAlreadyBlocked = await redisClient.get(blockKey);
            if (!isAlreadyBlocked) {
              await redisClient.set(blockKey, '1', 'EX', 3600); // Block for 1 hour
              logger.warn(`Abuse detected: IP ${ip} exceeded daily violation threshold (${score} violations). Temporary block applied.`);
              
              // In a real scenario, this would send an email or Slack webhook
              // e.g. await slackWebhook.send(`IP ${ip} blocked due to ${violator.score} violations today.`);
            }
          }
        }
        
      } catch (error) {
         logger.error('Failed to run abuse scan', { error });
      }

      logger.info('Rate limit abuse scan completed.');
      return { success: true };
    }
  }, { connection: redisClient });

  worker.on('failed', (job, err) => {
    logger.error('Security job failed', { jobId: job?.id, error: err.message });
  });

  return worker;
};

/**
 * Schedule the security job.
 */
export const scheduleSecurityJob = async () => {
  const repeatableJobs = await securityQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.name === JOB_NAME) {
      await securityQueue.removeRepeatableByKey(job.key);
    }
  }

  await securityQueue.add(JOB_NAME, {}, {
    repeat: {
      pattern: '*/5 * * * *' // Every 5 minutes
    }
  });
  
  logger.info('Scheduled rate limit abuse scan every 5 minutes.');
};
