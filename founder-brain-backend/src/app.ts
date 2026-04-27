import express, { Application, Request, Response } from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import healthCheck from './middleware/healthCheck';
import meetingRoutes from './routes/meetingRoutes';
import taskRoutes from './routes/taskRoutes';
import queryRoutes from './routes/queryRoutes';
import authRoutes from './routes/authRoutes';
import notificationRoutes from './routes/notificationRoutes';
import metricsRoutes from './routes/metricsRoutes';
import adminRoutes from './routes/adminRoutes';
import docsRoutes from './routes/docsRoutes';
import { errorHandler } from './middleware/errorHandler';
import { performanceMiddleware } from './middleware/performanceMiddleware';
import { cacheMiddleware } from './middleware/cacheMiddleware';
import { idempotencyMiddleware } from './middleware/idempotencyMiddleware';
import { container } from './config/container';
import logger from './config/logger';
import config from './config/environment';

// Phase 8 Security & Rate Limiting
import { helmetConfig } from './middleware/security/helmetConfig';
import { corsConfig } from './middleware/security/corsConfig';
import { sanitizationPipeline } from './middleware/security/sanitization';
import { ddosProtection } from './middleware/ddosProtection';
import { globalRateLimiter, blockListCheck } from './middleware/rateLimiter/globalRateLimit';
import { wsSecurityHeaders } from './socket/securityHeaders';

// Phase 9 Monitoring
import { requestTracerMiddleware } from './middleware/requestTracer';
import { metricsMiddleware } from './middleware/metricsMiddleware';

// Phase 13 Auth

/**
 * Express Application setup.
 */
const app: Application = express();

app.set('trust proxy', 1); // Trust first proxy if deploying behind Nginx/ALB

// Apply WS Security Headers on the socket path before body parsers
app.use(config.SOCKET_PATH || '/socket.io', wsSecurityHeaders);

// 0. Request Tracing
app.use(requestTracerMiddleware);

// 1. Prometheus Metrics Recording
app.use(metricsMiddleware);

// 2. Performance Monitoring
app.use(performanceMiddleware(logger));

// 3. DDoS Protection
app.use(ddosProtection);
app.use(blockListCheck);

// 4. Security Headers
app.use(helmetConfig());

// 5. Response Compression
app.use(compression({
  level: config.COMPRESSION_LEVEL || 6,
  threshold: 1024,
  filter: (req) => req.headers['upgrade'] !== 'websocket'
}));

// 6. Cross-Origin Resource Sharing
app.use(corsConfig());

// 7. Cookie Parser (Required for Auth & CSRF)
app.use(cookieParser(config.CSRF_SECRET));

// 8. Global Rate Limiter
app.use(globalRateLimiter);

// 9. Body Parsers & Input Sanitization
app.use(sanitizationPipeline);

// 10. Global Cache Middleware
const cacheService = container.getCacheService();
app.use(cacheMiddleware(cacheService));

// 12. Routes
app.get('/health', healthCheck);
app.use('/', metricsRoutes);
app.use('/admin', adminRoutes);
app.use('/api/auth', authRoutes); // Auth routes (login, register, logout, etc.)
app.use('/api/meetings', meetingRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/notifications', notificationRoutes);

// Documentation (Phase 10)
if (config.SWAGGER_ENABLED) {
  app.use(config.SWAGGER_PATH, docsRoutes);
}

// 14. Global Error Handler
app.use(errorHandler);

export default app;
