import { ClientSession } from 'mongoose';
import { INotificationDocument } from '../models/Notification';

export interface INotificationRepository {
  create(data: any, options?: { session?: ClientSession }): Promise<INotificationDocument>;
  createBatch(data: any[], options?: { session?: ClientSession }): Promise<INotificationDocument[]>;
  findByUserId(userId: string, limit: number, offset: number, options?: { session?: ClientSession }): Promise<{ notifications: INotificationDocument[]; total: number }>;
  markAsRead(id: string, userId: string, options?: { session?: ClientSession }): Promise<INotificationDocument | null>;
  markAllAsRead(userId: string, options?: { session?: ClientSession }): Promise<number>;
  getUnreadCount(userId: string, options?: { session?: ClientSession }): Promise<number>;
  deleteOld(daysOld: number, options?: { session?: ClientSession }): Promise<number>;
}
