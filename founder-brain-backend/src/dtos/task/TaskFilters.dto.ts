import { z } from 'zod';
import { PaginationQuerySchema } from '../base/Pagination.dto';

/**
 * Filter schema for listing tasks.
 */
export const TaskFiltersRequestSchema = PaginationQuerySchema.extend({
  status: z.enum(['pending', 'completed']).optional(),
  owner: z.string().optional(),
  meetingId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Meeting ID format").optional(),
  fromDate: z.string().datetime().or(z.date()).optional(),
  toDate: z.string().datetime().or(z.date()).optional(),
  includeCompleted: z.boolean().default(false).optional(),
});

export type TaskFiltersRequestDto = z.infer<typeof TaskFiltersRequestSchema>;
