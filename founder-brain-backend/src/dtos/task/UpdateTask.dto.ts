import { z } from 'zod';

/**
 * Filter schema for updating a task (PATCH semantics).
 */
export const UpdateTaskRequestSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  owner: z.string().min(1).max(100).optional(),
  deadline: z.string().datetime().or(z.date()).nullable().optional(),
  status: z.enum(['pending', 'completed']).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

export type UpdateTaskRequestDto = z.infer<typeof UpdateTaskRequestSchema>;
