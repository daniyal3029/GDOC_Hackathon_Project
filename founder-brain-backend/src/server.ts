import mongoose from 'mongoose';
import { createServer } from 'http';
import app from './app';
import { validateEnv } from './config/environment';
import { connectDB } from './config/database';
import { redisClient, disconnectRedis } from './config/redis';
import { startWorker, stopWorker } from './workers/WorkerManager';
import { initLanceDb, closeLanceDb } from './config/lanceDb';
import { startEmbeddingWorker } from './workers/EmbeddingWorker';
import { container } from './config/container';
import logger from './config/logger';

// Phase 9 Monitoring
import { enableDatabaseMetrics } from './monitoring/metrics/DatabaseMetrics';
import { startQueueMetricsCollector, stopQueueMetricsCollector } from './monitoring/metrics/QueueMetrics';

/**
 * Starts the server and connects to all services.
 */
const startServer = async (): Promise<void> => {
  try {
    // 1. Validate environment variables
    const config = validateEnv();

    // 2. Connect to MongoDB
    await connectDB();

    // 3. Connect to LanceDB
    await initLanceDb();

    // 4. Redis status check
    logger.info(`Redis Status: ${redisClient.status}`);

    // 5. Create HTTP Server
    const httpServer = createServer(app);

    // 6. Attach Socket.io to HTTP Server (DI already initialized core services)
    container.attachSocketServer(httpServer);

    // 7. Ensure Database Indexes
    const indexManager = container.getIndexManager();
    await indexManager.ensureIndexes();

    // 8. Start Workers
    await startWorker();
    startEmbeddingWorker();

    // 9. Initialize Monitoring
    enableDatabaseMetrics();
    startQueueMetricsCollector();

    // 10. Start listening
    const server = httpServer.listen(config.PORT, () => {
      logger.info(`
        Founder Brain Backend - Version 1.0.0
        ------------------------------
        Server: http://localhost:${config.PORT}
        WebSocket: ${config.SOCKET_PATH}
        Environment: ${config.NODE_ENV}
        MongoDB: Connected (Pooled)
        Redis: ${redisClient.status}
        Caching: Enabled
        Compression: Enabled (L${config.COMPRESSION_LEVEL})
        Workers: Active
        Monitoring: Enabled
        Metrics: /metrics
        Health: /health/detailed
      `);
    });

    /**
     * Graceful shutdown handler.
     */
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed.');
        
        try {
          // Stop Workers
          await stopWorker();

          // Stop monitoring
          stopQueueMetricsCollector();

          // Close MongoDB connection
          await mongoose.connection.close();
          logger.info('MongoDB connection closed.');
          
          // Close Redis connection
          await disconnectRedis();

          // Close LanceDB connection
          await closeLanceDb();
          
          logger.info('Graceful shutdown complete. Exiting...');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error: error instanceof Error ? error.message : 'Unknown error' });
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : 'Unknown error' });
    process.exit(1);
  }
};

startServer();
