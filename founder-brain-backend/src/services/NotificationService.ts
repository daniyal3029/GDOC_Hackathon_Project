import mongoose from 'mongoose';
import { INotificationService } from '../interfaces/INotificationService';
import { INotificationRepository } from '../interfaces/INotificationRepository';
import { ISocketServer } from '../interfaces/ISocketServer';
import { ILogger } from '../interfaces/ILogger';
import { INotificationDocument, NotificationType } from '../models/Notification';
import { SocketEvents } from '../socket/SocketEvents';
import config from '../config/environment';

export class NotificationService implements INotificationService {
  constructor(
    private notificationRepository: INotificationRepository,
    private socketServer: ISocketServer,
    private logger: ILogger
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata: any = {}
  ): Promise<INotificationDocument> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (config.NOTIFICATION_RETENTION_DAYS || 30));

    const notification = await this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      metadata,
      expiresAt,
    });

    // Push via WebSocket
    this.socketServer.emitToUser(userId, SocketEvents.NOTIFICATION_NEW, notification);
    
    // Also update unread count
    const unreadCount = await this.notificationRepository.getUnreadCount(userId);
    this.socketServer.emitToUser(userId, SocketEvents.NOTIFICATION_COUNT, { unreadCount });

    return notification;
  }

  async sendTaskAssignedNotification(taskId: string, owner: string, assignedBy: string): Promise<INotificationDocument> {
    return this.createNotification(
      owner,
      NotificationType.TASK_ASSIGNED,
      'New Task Assigned',
      `You have been assigned a new task: "${taskId}"`,
      { taskId, assignedBy }
    );
  }

  async sendMeetingProcessedNotification(meetingId: string, userId: string): Promise<INotificationDocument> {
    return this.createNotification(
      userId,
      NotificationType.MEETING_PROCESSED,
      'Meeting Processed',
      'Your meeting notes have been successfully processed and tasks extracted.',
      { meetingId }
    );
  }

  async sendDeadlineReminder(taskId: string, owner: string, daysLeft: number): Promise<INotificationDocument> {
    return this.createNotification(
      owner,
      NotificationType.DEADLINE_REMINDER,
      'Upcoming Deadline',
      `Task "${taskId}" is due in ${daysLeft} day(s).`,
      { taskId }
    );
  }

  async markAsRead(id: string, userId: string): Promise<INotificationDocument | null> {
    return await this.notificationRepository.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string): Promise<number> {
    return await this.notificationRepository.markAllAsRead(userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.getUnreadCount(userId);
  }

  async getUserNotifications(userId: string, page: number, limit: number): Promise<any> {
    const offset = (page - 1) * limit;
    const { notifications, total } = await this.notificationRepository.findByUserId(userId, limit, offset);
    
    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
