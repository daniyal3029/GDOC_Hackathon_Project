import { ClientSession } from 'mongoose';
import { ITaskDocument } from '../models/Task';

/**
 * Interface for Task Repository.
 */
export interface ITaskRepository {
  create(taskData: Partial<ITaskDocument>, options?: { session?: ClientSession }): Promise<ITaskDocument>;
  createMany(tasksData: Partial<ITaskDocument>[], options?: { session?: ClientSession }): Promise<ITaskDocument[]>;
  findByMeetingId(meetingId: string, options?: { session?: ClientSession }): Promise<ITaskDocument[]>;
  findById(taskId: string, options?: { session?: ClientSession }): Promise<ITaskDocument | null>;
  findAll(filters: any, options?: { session?: ClientSession }): Promise<{ tasks: ITaskDocument[]; total: number }>;
  findPendingGroupedByOwner(options?: { session?: ClientSession }): Promise<any>;
  updateWithOptimisticLock(
    taskId: string, 
    updates: any, 
    expectedVersion: number, 
    options?: { session?: ClientSession }
  ): Promise<ITaskDocument | null>;
}
