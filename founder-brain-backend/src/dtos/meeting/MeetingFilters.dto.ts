import { z } from 'zod';
import { PaginationQuerySchema } from '../base/Pagination.dto';

/**
 * Filter schema for listing meetings.
 */
export const MeetingFiltersRequestSchema = PaginationQuerySchema.extend({
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  search: z.string().optional(),
  fromDate: z.string().datetime().or(z.date()).optional(),
  toDate: z.string().datetime().or(z.date()).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'summary']).default('createdAt'),
});

export type MeetingFiltersRequestDto = z.infer<typeof MeetingFiltersRequestSchema>;
