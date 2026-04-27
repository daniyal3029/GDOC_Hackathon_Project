/**
 * Interface for the application logger.
 */
export interface ILogger {
  /**
   * Log an error message.
   * @param message - The message to log.
   * @param meta - Additional metadata.
   */
  error(message: string, meta?: object): void;

  /**
   * Log a warning message.
   * @param message - The message to log.
   * @param meta - Additional metadata.
   */
  warn(message: string, meta?: object): void;

  /**
   * Log an info message.
   * @param message - The message to log.
   * @param meta - Additional metadata.
   */
  info(message: string, meta?: object): void;

  /**
   * Log a debug message.
   * @param message - The message to log.
   * @param meta - Additional metadata.
   */
  debug(message: string, meta?: object): void;

  /**
   * Create a child logger with additional context.
   * @param context - The context to add to the child logger.
   */
  child(context: object): ILogger;
}
