import { ClientSession } from 'mongoose';
import { Task, ITaskDocument } from '../models/Task';
import { ITaskRepository } from '../interfaces/ITaskRepository';
import logger from '../config/logger';

/**
 * Mongoose implementation of ITaskRepository.
 */
export class TaskRepository implements ITaskRepository {
  async create(taskData: Partial<ITaskDocument>, options?: { session?: ClientSession }): Promise<ITaskDocument> {
    try {
      const task = new Task(taskData);
      const savedTask = await task.save({ session: options?.session });
      logger.info('Task created in database', { taskId: savedTask._id });
      return savedTask;
    } catch (error) {
      logger.error('Error creating task', { error, data: taskData });
      throw error;
    }
  }

  async createMany(tasksData: Partial<ITaskDocument>[], options?: { session?: ClientSession }): Promise<ITaskDocument[]> {
    try {
      const tasks = await Task.insertMany(tasksData, { session: options?.session });
      logger.info(`${tasks.length} tasks created in database`);
      return tasks as unknown as ITaskDocument[];
    } catch (error) {
      logger.error('Error creating multiple tasks', { error });
      throw error;
    }
  }

  async findByMeetingId(meetingId: string, options?: { session?: ClientSession }): Promise<ITaskDocument[]> {
    try {
      return await Task.find({ meetingId }).session(options?.session || null).lean().exec() as any;
    } catch (error) {
      logger.error('Error finding tasks by meeting ID', { error, meetingId });
      throw error;
    }
  }

  async findById(taskId: string, options?: { session?: ClientSession }): Promise<ITaskDocument | null> {
    try {
      return await Task.findById(taskId).session(options?.session || null).exec();
    } catch (error) {
      logger.error('Error finding task by ID', { error, taskId });
      throw error;
    }
  }

  async findAll(filters: any, options?: { session?: ClientSession }): Promise<{ tasks: ITaskDocument[]; total: number }> {
    try {
      const query: any = {};
      
      if (filters.status) query.status = filters.status;
      if (filters.owner) query.owner = { $regex: filters.owner, $options: 'i' };
      if (filters.meetingId) query.meetingId = filters.meetingId;
      if (filters.fromDate || filters.toDate) {
        query.deadline = {};
        if (filters.fromDate) query.deadline.$gte = new Date(filters.fromDate);
        if (filters.toDate) query.deadline.$lte = new Date(filters.toDate);
      }

      const total = await Task.countDocuments(query).session(options?.session || null);
      const tasks = await Task.find(query)
        .session(options?.session || null)
        .sort({ deadline: 1 })
        .skip(filters.skip || 0)
        .limit(filters.limit || 20)
        .lean()
        .exec();

      return { tasks: tasks as any, total };
    } catch (error) {
      logger.error('Error finding all tasks', { error, filters });
      throw error;
    }
  }

  async findPendingGroupedByOwner(options?: { session?: ClientSession }): Promise<any> {
    try {
      const result = await Task.aggregate([
        { $match: { status: 'pending' } },
        { $sort: { deadline: 1 } },
        {
          $group: {
            _id: { $ifNull: ['$owner', 'Unassigned'] },
            tasks: { $push: '$$ROOT' },
          },
        },
      ]).session(options?.session || null);

      const grouped: Record<string, any[]> = {};
      result.forEach((item) => {
        grouped[item._id] = item.tasks;
      });

      return grouped;
    } catch (error) {
      logger.error('Error grouping pending tasks', { error });
      throw error;
    }
  }

  async updateWithOptimisticLock(
    taskId: string,
    updates: any,
    expectedVersion: number,
    options?: { session?: ClientSession }
  ): Promise<ITaskDocument | null> {
    try {
      const updatedTask = await Task.findOneAndUpdate(
        { _id: taskId, version: expectedVersion },
        { 
          ...updates, 
          $inc: { version: 1 } 
        },
        { new: true, session: options?.session }
      ).exec();

      if (updatedTask) {
        logger.info('Task updated with optimistic lock', { taskId, version: updatedTask.version });
      } else {
        logger.warn('Optimistic lock update failed', { taskId, expectedVersion });
      }

      return updatedTask;
    } catch (error) {
      logger.error('Error updating task with optimistic lock', { error, taskId });
      throw error;
    }
  }
}
