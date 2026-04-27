/**
 * Custom error class for application-specific errors.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;

  /**
   * @param message - The error message.
   * @param statusCode - The HTTP status code.
   */
  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    (Error as any).captureStackTrace(this, this.constructor);
  }
}

export default AppError;
