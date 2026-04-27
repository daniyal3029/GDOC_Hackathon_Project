import { z } from 'zod';

/**
 * Standard pagination query parameters.
 */
export const PaginationQuerySchema = z.object({
  page: z.preprocess((val) => Number(val ?? 1), z.number().int().min(1).default(1)),
  limit: z.preprocess((val) => Number(val ?? 10), z.number().int().min(1).max(100).default(10)),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQueryDto = z.infer<typeof PaginationQuerySchema>;

/**
 * Standard pagination metadata in response.
 */
export interface PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Generic paginated response wrapper.
 */
export interface PaginatedResponseDto<T> {
  data: T[];
  pagination: PaginationMetaDto;
}
