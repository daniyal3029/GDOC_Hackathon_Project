/**
 * Data associated with a meeting processing job.
 */
export interface MeetingJobData {
  meetingId: string;
  text: string;
  idempotencyKey?: string;
}

/**
 * Structure of a job status response.
 */
export interface JobStatusResponse {
  jobId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  progress?: number;
  result?: any;
}

/**
 * Health check response for a meeting.
 */
export interface MeetingStatusResponse {
  status: string;
  progress: number;
  jobId?: string;
  result?: any;
  error?: string;
}
