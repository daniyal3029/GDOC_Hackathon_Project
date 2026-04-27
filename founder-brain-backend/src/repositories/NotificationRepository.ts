import { ClientSession } from 'mongoose';
import { Notification, INotificationDocument } from '../models/Notification';
import { INotificationRepository } from '../interfaces/INotificationRepository';

export class NotificationRepository implements INotificationRepository {
  async create(data: any, options?: { session?: ClientSession }): Promise<INotificationDocument> {
    const notification = new Notification(data);
    return await notification.save({ session: options?.session });
  }

  async createBatch(data: any[], options?: { session?: ClientSession }): Promise<INotificationDocument[]> {
    return await Notification.insertMany(data, { session: options?.session }) as unknown as INotificationDocument[];
  }

  async findByUserId(userId: string, limit: number, offset: number, options?: { session?: ClientSession }): Promise<{ notifications: INotificationDocument[]; total: number }> {
    const [notifications, total] = await Promise.all([
      Notification.find({ userId })
        .session(options?.session || null)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit),
      Notification.countDocuments({ userId }).session(options?.session || null)
    ]);

    return { notifications, total };
  }

  async markAsRead(id: string, userId: string, options?: { session?: ClientSession }): Promise<INotificationDocument | null> {
    return await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true, readAt: new Date() },
      { new: true, session: options?.session }
    );
  }

  async markAllAsRead(userId: string, options?: { session?: ClientSession }): Promise<number> {
    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() },
      { session: options?.session }
    );
    return result.modifiedCount;
  }

  async getUnreadCount(userId: string, options?: { session?: ClientSession }): Promise<number> {
    return await Notification.countDocuments({ userId, read: false }).session(options?.session || null);
  }

  async deleteOld(daysOld: number, options?: { session?: ClientSession }): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const result = await Notification.deleteMany({ createdAt: { $lt: cutoffDate } }, { session: options?.session });
    return result.deletedCount;
  }
}
