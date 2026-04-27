import { Router, Request, Response } from 'express';
import { register } from '../monitoring/metrics/MetricsService';
import { HealthChecker } from '../monitoring/health/HealthChecker';

const router = Router();
const healthChecker = new HealthChecker();

/**
 * @route GET /metrics
 * @desc Prometheus metrics scrape endpoint
 */
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end('Error collecting metrics');
  }
});

/**
 * @route GET /live
 * @desc Liveness probe — returns 200 if the process is running
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

/**
 * @route GET /ready
 * @desc Readiness probe — checks all dependencies
 */
router.get('/ready', async (_req: Request, res: Response) => {
  const ready = await healthChecker.isReady();
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready' });
});

/**
 * @route GET /health/detailed
 * @desc Detailed health with all dependency statuses
 */
router.get('/health/detailed', async (_req: Request, res: Response) => {
  const health = await healthChecker.getDetailedHealth();
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
