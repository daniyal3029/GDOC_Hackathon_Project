export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  traceId?: string;
  path?: string;
  details?: any;
}

export interface QueryResponse {
  answer: string;
  sources: {
    meetingId: string;
    relevanceScore: number;
    excerpt: string;
  }[];
  processingTimeMs: number;
  question: string;
}
