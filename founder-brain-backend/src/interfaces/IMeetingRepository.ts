import { ClientSession } from 'mongoose';
import { IMeetingDocument } from '../models/Meeting';

/**
 * Interface for Meeting Repository.
 */
export interface IMeetingRepository {
  create(meetingData: Partial<IMeetingDocument>, options?: { session?: ClientSession }): Promise<IMeetingDocument>;
  findById(id: string, options?: { session?: ClientSession }): Promise<IMeetingDocument | null>;
  updateStatus(id: string, status: string, errorMessage?: string, options?: { session?: ClientSession }): Promise<IMeetingDocument | null>;
  updateWithTasks(
    id: string,
    summary: string,
    decisions: string[],
    taskIds: string[],
    metadata: any,
    options?: { session?: ClientSession }
  ): Promise<IMeetingDocument | null>;
  findPending(options?: { session?: ClientSession }): Promise<IMeetingDocument[]>;
  findPaginated(
    filters: any,
    pagination: { skip: number; limit: number; sortBy?: string; sortOrder?: string },
    options?: { session?: ClientSession }
  ): Promise<{ meetings: IMeetingDocument[]; total: number }>;
  getStatistics(userId: string, options?: { session?: ClientSession }): Promise<{ total: number; byStatus: Record<string, number> }>;
  getTaskCompletionRate(meetingId: string, options?: { session?: ClientSession }): Promise<{ total: number; completed: number; percent: number }>;
}
