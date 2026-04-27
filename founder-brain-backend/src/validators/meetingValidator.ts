import { z } from 'zod';

/**
 * Validation schema for meeting filters.
 */
export const meetingFiltersSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  page: z.coerce.number().int().min(1).default(1),
});
