import { z } from 'zod';

/**
 * Request DTO for semantic query.
 */
export const AskQuestionRequestSchema = z.object({
  question: z.string().min(3, "Question too short").max(500, "Question too long"),
  maxSources: z.number().int().min(1).max(10).default(5).optional(),
  includeMetadata: z.boolean().default(true).optional(),
  stream: z.boolean().default(false).optional(),
});

export type AskQuestionRequestDto = z.infer<typeof AskQuestionRequestSchema>;
