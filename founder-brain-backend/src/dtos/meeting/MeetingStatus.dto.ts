/**
 * Response DTO for meeting processing status.
 */
export class MeetingStatusResponseDto {
  meetingId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  jobId?: string;
  currentStep?: 'queued' | 'ai_processing' | 'saving_tasks' | 'generating_embeddings' | 'complete';
  errorMessage?: string;
  estimatedRemainingMs?: number;
  createdAt: string;
  updatedAt: string;

  constructor(data: any) {
    this.meetingId = data.meetingId || data.id;
    this.status = data.status;
    this.progress = data.progress || 0;
    this.jobId = data.jobId;
    this.currentStep = data.currentStep;
    this.errorMessage = data.errorMessage || data.error;
    this.estimatedRemainingMs = data.estimatedRemainingMs;
    this.createdAt = data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt).toISOString() : new Date().toISOString();
  }
}
