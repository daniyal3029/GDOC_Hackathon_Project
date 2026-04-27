import { PaginationMetaDto } from './Pagination.dto';

/**
 * Standard API Response Wrapper.
 */
export class ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  traceId: string;
  pagination?: PaginationMetaDto;

  constructor(data: T, success: boolean = true, message?: string, pagination?: PaginationMetaDto) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
    this.traceId = Math.random().toString(36).substring(2, 11); // Simple traceId for hackathon
    this.pagination = pagination;
  }

  /**
   * Static helper for successful responses.
   */
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse(data, true, message);
  }

  /**
   * Static helper for paginated responses.
   */
  static paginated<T>(data: T[], meta: PaginationMetaDto, message?: string): ApiResponse<T[]> {
    return new ApiResponse(data, true, message, meta);
  }

  /**
   * Static helper for error responses.
   */
  static error<T>(message: string, data: any = null): ApiResponse<T> {
    return new ApiResponse(data as T, false, message);
  }
}
