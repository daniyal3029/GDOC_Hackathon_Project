import { Request, Response, NextFunction } from 'express';
import { INotificationService } from '../interfaces/INotificationService';
import { ApiResponse } from '../dtos/base/ApiResponse.dto';

export class NotificationController {
  constructor(private notificationService: INotificationService) {}

  getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.query.userId as string; // For hackathon
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        return res.status(400).json(ApiResponse.error('userId is required'));
      }

      const result = await this.notificationService.getUserNotifications(userId, page, limit);
      return res.status(200).json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json(ApiResponse.error('userId is required'));

      const count = await this.notificationService.getUnreadCount(userId);
      return res.status(200).json(ApiResponse.success({ count }));
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.body.userId;
      if (!userId) return res.status(400).json(ApiResponse.error('userId is required'));

      await this.notificationService.markAsRead(id, userId);
      return res.status(200).json(ApiResponse.success(null, 'Notification marked as read'));
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId;
      if (!userId) return res.status(400).json(ApiResponse.error('userId is required'));

      const count = await this.notificationService.markAllAsRead(userId);
      return res.status(200).json(ApiResponse.success({ modifiedCount: count }, 'All notifications marked as read'));
    } catch (error) {
      next(error);
    }
  };
}
