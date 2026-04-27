import cors from 'cors';
import config from '../../config/environment';

/**
 * Configure Cross-Origin Resource Sharing (CORS) for production.
 */
export const corsConfig = () => {
  const allowedOrigins = config.CORS_ORIGIN 
    ? config.CORS_ORIGIN.split(',').map(origin => origin.trim()) 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl) or allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy restricts access from origin ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    // allowedHeaders removed to allow all requested headers
    exposedHeaders: ['X-Cache', 'Idempotency-Replayed', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'Retry-After'],
    maxAge: 86400, // 24 hours (cache preflight response)
  });
};
