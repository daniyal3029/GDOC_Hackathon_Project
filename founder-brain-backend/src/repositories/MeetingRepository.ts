import { ClientSession, Types } from 'mongoose';
import { Meeting, IMeetingDocument } from '../models/Meeting';
import { IMeetingRepository } from '../interfaces/IMeetingRepository';
import logger from '../config/logger';

/**
 * Mongoose implementation of IMeetingRepository.
 */
export class MeetingRepository implements IMeetingRepository {
  async create(meetingData: Partial<IMeetingDocument>, options?: { session?: ClientSession }): Promise<IMeetingDocument> {
    try {
      const meeting = new Meeting(meetingData);
      const savedMeeting = await meeting.save({ session: options?.session });
      logger.info('Meeting created in database', { meetingId: savedMeeting._id });
      return savedMeeting;
    } catch (error) {
      logger.error('Error creating meeting', { error, data: meetingData });
      throw error;
    }
  }

  async findById(id: string, options?: { session?: ClientSession }): Promise<IMeetingDocument | null> {
    try {
      return await Meeting.findById(id).populate('tasks').session(options?.session || null).lean().exec() as any;
    } catch (error) {
      logger.error('Error finding meeting by ID', { error, meetingId: id });
      throw error;
    }
  }

  async updateStatus(id: string, status: string, errorMessage?: string, options?: { session?: ClientSession }): Promise<IMeetingDocument | null> {
    try {
      const update: any = { processingStatus: status };
      if (errorMessage) {
        update.errorMessage = errorMessage;
      }
      
      const updatedMeeting = await Meeting.findByIdAndUpdate(id, update, { new: true, session: options?.session }).exec();
      logger.info('Meeting status updated', { meetingId: id, status });
      return updatedMeeting;
    } catch (error) {
      logger.error('Error updating meeting status', { error, meetingId: id, status });
      throw error;
    }
  }

  async updateWithTasks(
    id: string,
    summary: string,
    decisions: string[],
    taskIds: string[],
    metadata: any,
    options?: { session?: ClientSession }
  ): Promise<IMeetingDocument | null> {
    try {
      const updatedMeeting = await Meeting.findByIdAndUpdate(
        id,
        {
          summary,
          decisions,
          tasks: taskIds,
          metadata,
          processingStatus: 'completed',
        },
        { new: true, session: options?.session }
      ).exec();
      logger.info('Meeting updated with AI results', { meetingId: id });
      return updatedMeeting;
    } catch (error) {
      logger.error('Error updating meeting with tasks', { error, meetingId: id });
      throw error;
    }
  }

  async findPending(options?: { session?: ClientSession }): Promise<IMeetingDocument[]> {
    try {
      return await Meeting.find({ processingStatus: 'pending' }).session(options?.session || null).lean().exec() as any;
    } catch (error) {
      logger.error('Error finding pending meetings', { error });
      throw error;
    }
  }

  async findPaginated(
    filters: any,
    pagination: { skip: number; limit: number; sortBy?: string; sortOrder?: string },
    options?: { session?: ClientSession }
  ): Promise<{ meetings: IMeetingDocument[]; total: number }> {
    try {
      const query: any = {};
      if (filters.userId) query.userId = filters.userId;
      if (filters.status) query.processingStatus = filters.status;
      if (filters.search) {
        query.$or = [
          { summary: { $regex: filters.search, $options: 'i' } },
          { decisions: { $elemMatch: { $regex: filters.search, $options: 'i' } } },
        ];
      }

      const sort: any = {};
      sort[pagination.sortBy || 'createdAt'] = pagination.sortOrder === 'asc' ? 1 : -1;

      const total = await Meeting.countDocuments(query).session(options?.session || null);
      const meetings = await Meeting.find(query)
        .session(options?.session || null)
        .sort(sort)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate('tasks')
        .exec();

      return { meetings, total };
    } catch (error) {
      logger.error('Error finding paginated meetings', { error, filters });
      throw error;
    }
  }

  async getStatistics(userId: string, options?: { session?: ClientSession }): Promise<{ total: number; byStatus: Record<string, number> }> {
    try {
      const stats = await Meeting.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$processingStatus',
            count: { $sum: 1 },
          },
        },
      ]).session(options?.session || null);

      const total = await Meeting.countDocuments({ userId }).session(options?.session || null);
      const byStatus: Record<string, number> = {};
      stats.forEach((s) => {
        byStatus[s._id] = s.count;
      });

      return { total, byStatus };
    } catch (error) {
      logger.error('Error getting meeting statistics', { error, userId });
      throw error;
    }
  }

  async getTaskCompletionRate(meetingId: string, options?: { session?: ClientSession }): Promise<{ total: number; completed: number; percent: number }> {
    try {
      const meeting = await Meeting.findById(meetingId).session(options?.session || null).populate('tasks').exec();
      if (!meeting || !meeting.tasks) {
        return { total: 0, completed: 0, percent: 0 };
      }

      const total = meeting.tasks.length;
      const completed = (meeting.tasks as any[]).filter((t) => t.status === 'completed').length;
      const percent = total > 0 ? (completed / total) * 100 : 0;

      return { total, completed, percent };
    } catch (error) {
      logger.error('Error getting task completion rate', { error, meetingId });
      throw error;
    }
  }
}
