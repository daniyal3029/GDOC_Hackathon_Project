import { ILogger } from '../interfaces/ILogger';

/**
 * Measures the execution time of an async function.
 */
export const measureExecutionTime = async <T>(
  name: string,
  fn: () => Promise<T>,
  logger: ILogger,
  threshold = 100
): Promise<T> => {
  const start = process.hrtime();
  try {
    return await fn();
  } finally {
    const [seconds, nanoseconds] = process.hrtime(start);
    const durationMs = (seconds * 1000 + nanoseconds / 1000000).toFixed(2);
    
    if (parseFloat(durationMs) > threshold) {
      logger.warn(`SLOW OPERATION Detected: ${name} took ${durationMs}ms`, { threshold });
    } else {
      logger.debug(`Operation ${name} took ${durationMs}ms`);
    }
  }
};
