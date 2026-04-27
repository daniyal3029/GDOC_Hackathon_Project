import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import dotenv from 'dotenv';
import { ILogger } from '../interfaces/ILogger';
import { requestContext } from '../monitoring/tracing/RequestTracer';
import { monitoringConfig } from './monitoringConfig';

dotenv.config();

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const logDir = monitoringConfig.logging.dir;

/**
 * Custom format that injects trace context into every log line.
 */
const traceFormat = winston.format((info) => {
  info.traceId = requestContext.getTraceId();
  info.userId = requestContext.getUserId() || undefined;
  return info;
});

/**
 * Custom format for console output in development.
 */
const consoleFormat = printf(({ level, message, timestamp, stack, traceId, ...meta }) => {
  const traceStr = traceId && traceId !== 'no-trace' ? ` [${traceId}]` : '';
  return `${timestamp} [${level}]:${traceStr} ${stack || message} ${
    Object.keys(meta).length && !meta.service ? JSON.stringify(meta) : ''
  }`;
});

/**
 * Winston logger with daily log rotation and structured output.
 */
const loggerInstance = winston.createLogger({
  level: monitoringConfig.logging.level,
  format: combine(
    traceFormat(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'founder-brain-backend' },
  transports: [
    // All logs, daily rotated
    new DailyRotateFile({
      filename: `${logDir}/app-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: `${monitoringConfig.logging.maxSizeMB}m`,
      maxFiles: `${monitoringConfig.logging.retentionDays}d`,
      zippedArchive: true,
    }),

    // Error-only log
    new DailyRotateFile({
      filename: `${logDir}/error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: `${monitoringConfig.logging.maxSizeMB}m`,
      maxFiles: `${monitoringConfig.logging.retentionDays}d`,
      zippedArchive: true,
    }),

    // Access log (info level request/response entries)
    new DailyRotateFile({
      filename: `${logDir}/access-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: `${monitoringConfig.logging.maxSizeMB}m`,
      maxFiles: `${monitoringConfig.logging.retentionDays}d`,
      zippedArchive: true,
    }),
  ],
});

// Console output in development
if (process.env.NODE_ENV !== 'production') {
  loggerInstance.add(
    new winston.transports.Console({
      format: combine(
        traceFormat(),
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    })
  );
}

/**
 * Logger wrapper that implements ILogger interface with trace context.
 */
class LoggerService implements ILogger {
  private logger: winston.Logger;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  error(message: string, meta?: object): void {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: object): void {
    this.logger.warn(message, meta);
  }

  info(message: string, meta?: object): void {
    this.logger.info(message, meta);
  }

  debug(message: string, meta?: object): void {
    this.logger.debug(message, meta);
  }

  child(context: object): ILogger {
    return new LoggerService(this.logger.child(context));
  }
}

export const logger: ILogger = new LoggerService(loggerInstance);
export default logger;
