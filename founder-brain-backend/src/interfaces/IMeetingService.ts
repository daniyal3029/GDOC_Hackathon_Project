import { IMeetingDocument } from '../models/Meeting';
import { MeetingResponseDto } from '../dtos/meeting/MeetingResponse.dto';
import { MeetingStatusResponseDto } from '../dtos/meeting/MeetingStatus.dto';
import { PaginatedResponseDto } from '../dtos/base/Pagination.dto';

/**
 * Interface for Meeting Service.
 */
export interface IMeetingService {
  /**
   * Start processing a meeting notes text asynchronously.
   */
  processMeetingAsync(text: string, idempotencyKey?: string): Promise<{ jobId: string; meetingId: string }>;

  /**
   * Get the current status and progress of a meeting processing.
   */
  getMeetingStatus(id: string): Promise<any>; // Can return internal status data for controller to wrap

  /**
   * Get the meeting document with populated tasks.
   */
  getMeetingWithTasks(id: string): Promise<IMeetingDocument>;

  /**
   * Get a list of meetings based on filters and pagination.
   */
  getMeetings(filters: any, pagination: any): Promise<PaginatedResponseDto<IMeetingDocument>>;

  /**
   * Get statistics for meetings.
   */
  getMeetingStatistics(): Promise<any>;

  /**
   * Get meeting with task progress.
   */
  getMeetingWithTaskProgress(meetingId: string): Promise<any>;
}
