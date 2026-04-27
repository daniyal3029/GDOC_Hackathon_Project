import { INotificationDocument, NotificationType } from '../models/Notification';

export interface INotificationService {
  createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any
  ): Promise<INotificationDocument>;
  
  sendTaskAssignedNotification(taskId: string, owner: string, assignedBy: string): Promise<INotificationDocument>;
  sendMeetingProcessedNotification(meetingId: string, userId: string): Promise<INotificationDocument>;
  sendDeadlineReminder(taskId: string, owner: string, daysLeft: number): Promise<INotificationDocument>;
  
  markAsRead(id: string, userId: string): Promise<INotificationDocument | null>;
  markAllAsRead(userId: string): Promise<number>;
  getUnreadCount(userId: string): Promise<number>;
  getUserNotifications(userId: string, page: number, limit: number): Promise<any>;
}
