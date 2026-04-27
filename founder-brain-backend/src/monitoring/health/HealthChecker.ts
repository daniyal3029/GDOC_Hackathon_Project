import mongoose from 'mongoose';
import { redisClient } from '../../config/redis';
import logger from '../../config/logger';
import { DependencyHealth, SystemHealth, HealthStatus } from '../../types/monitoring.types';

/**
 * Checks all dependency health and returns a composite system health status.
 */
export class HealthChecker {
  private version: string;
  private startTime: number;

  constructor() {
    this.version = process.env.npm_package_version || '1.0.0';
    this.startTime = Date.now();
  }

  /**
   * Returns the full system health including all dependency checks.
   */
  async getDetailedHealth(): Promise<SystemHealth> {
    const checks = await Promise.all([
      this.checkMongo(),
      this.checkRedis(),
    ]);

    const worstStatus = checks.reduce<HealthStatus>((worst: HealthStatus, dep: DependencyHealth) => {
      if (dep.status === 'unhealthy') return 'unhealthy';
      if (dep.status === 'degraded' && worst !== 'unhealthy') return 'degraded';
      return worst;
    }, 'healthy');

    return {
      status: worstStatus,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: this.version,
      dependencies: checks,
      timestamp: new Date(),
    };
  }

  /**
   * Liveness: just checks if the process is alive.
   */
  isAlive(): boolean {
    return true;
  }

  /**
   * Readiness: checks if dependencies are connected.
   */
  async isReady(): Promise<boolean> {
    const health = await this.getDetailedHealth();
    return health.status !== 'unhealthy';
  }

  private async checkMongo(): Promise<DependencyHealth> {
    const start = Date.now();
    try {
      if (mongoose.connection.readyState !== 1) {
        return { name: 'mongodb', status: 'unhealthy', responseTimeMs: Date.now() - start, message: 'Not connected', lastChecked: new Date() };
      }
      await mongoose.connection.db!.admin().ping();
      return { name: 'mongodb', status: 'healthy', responseTimeMs: Date.now() - start, lastChecked: new Date() };
    } catch (error: any) {
      return { name: 'mongodb', status: 'unhealthy', responseTimeMs: Date.now() - start, message: error.message, lastChecked: new Date() };
    }
  }

  private async checkRedis(): Promise<DependencyHealth> {
    const start = Date.now();
    try {
      const pong = await redisClient.ping();
      return {
        name: 'redis',
        status: pong === 'PONG' ? 'healthy' : 'degraded',
        responseTimeMs: Date.now() - start,
        lastChecked: new Date(),
      };
    } catch (error: any) {
      return { name: 'redis', status: 'unhealthy', responseTimeMs: Date.now() - start, message: error.message, lastChecked: new Date() };
    }
  }
}
