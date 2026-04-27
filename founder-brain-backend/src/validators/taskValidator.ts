import { z } from 'zod';
import mongoose from 'mongoose';

/**
 * Validation schema for updating a task.
 */
export const updateTaskSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  owner: z.string().min(1).max(100).optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  status: z.enum(['pending', 'completed']).optional(),
  version: z.number().int().min(0).optional(),
});

/**
 * Validation schema for task filters.
 */
export const taskFiltersSchema = z.object({
  status: z.enum(['pending', 'completed']).optional(),
  owner: z.string().optional(),
  meetingId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid meetingId format',
  }).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
});
