/**
 * Standard Error DTO format.
 */
export interface ApiErrorDto {
  statusCode: number;
  message: string;
  error: string;
  details?: any;
  timestamp: string;
  traceId: string;
  path?: string;
}

/**
 * Factory for creating error DTOs.
 */
export const createApiErrorDto = (
  statusCode: number,
  message: string,
  error: string,
  traceId: string,
  path?: string,
  details?: any
): ApiErrorDto => ({
  statusCode,
  message,
  error,
  details,
  timestamp: new Date().toISOString(),
  traceId,
  path,
});
