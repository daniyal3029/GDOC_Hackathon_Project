/**
 * API Response and Parameter Types
 */

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TaskResponse {
  id: string;
  description: string;
  owner: string | null;
  deadline: string | null;
  status: 'pending' | 'completed';
  version: number;
  meetingId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  status?: 'pending' | 'completed';
  owner?: string;
  meetingId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface MeetingFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MeetingStats {
  total: number;
  byStatus: Record<string, number>;
}

export interface MeetingProgress {
  id: string;
  summary: string;
  taskProgress: {
    total: number;
    completed: number;
    percent: number;
  };
}

export interface Source {
  meetingId: string;
  relevanceScore: number;
  excerpt: string;
}

export interface QueryResponse {
  answer: string;
  sources: Source[];
  processingTimeMs: number;
}

export interface VectorSearchResult {
  text: string;
  meetingId: string;
  similarity: number;
  metadata: any;
}

export interface MeetingResponse {
  id: string;
  rawText: string;
  summary: string;
  decisions: string[];
  tasks?: any[];
  processingStatus: string;
  embeddingStatus: string;
  jobId?: string;
  errorMessage?: string;
  processingDuration?: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}
