import { z } from 'zod';

/**
 * Request DTO for creating a meeting.
 */
export const CreateMeetingRequestSchema = z.object({
  text: z.string()
    .min(10, "Text must be at least 10 characters")
    .max(50000, "Text must not exceed 50,000 characters"),
  metadata: z.object({
    title: z.string().optional(),
    meetingDate: z.string().datetime().or(z.date()).optional(),
    attendees: z.array(z.string()).optional(),
  }).optional(),
  idempotencyKey: z.string().optional(),
});

export type CreateMeetingRequestDto = z.infer<typeof CreateMeetingRequestSchema>;
