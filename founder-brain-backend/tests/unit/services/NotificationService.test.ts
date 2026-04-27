import { NotificationService } from '../../../src/services/NotificationService';
import { NotificationType } from '../../../src/models/Notification';

describe('NotificationService Unit Tests', () => {
  let notificationService: NotificationService;
  let mockNotificationRepo: any;
  let mockSocketServer: any;
  let mockLogger: any;

  beforeEach(() => {
    mockNotificationRepo = {
      create: jest.fn().mockImplementation((n) => ({ ...n, _id: 'notif-123' })),
      findById: jest.fn(),
      findPaginated: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      getUnreadCount: jest.fn().mockResolvedValue(5),
    };
    mockSocketServer = {
        emitToUser: jest.fn(),
        emitToAll: jest.fn(),
    };
    mockLogger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };

    notificationService = new NotificationService(mockNotificationRepo, mockSocketServer, mockLogger);
  });

  describe('createNotification', () => {
    it('should create and emit a notification', async () => {
      const result = await notificationService.createNotification(
        'user-123',
        NotificationType.INFO,
        'Test Title',
        'Test Message'
      );

      expect(result).toHaveProperty('_id', 'notif-123');
      expect(mockNotificationRepo.create).toHaveBeenCalled();
      expect(mockSocketServer.emitToUser).toHaveBeenCalledWith('user-123', 'notification:new', expect.anything());
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      await notificationService.markAsRead('notif-123', 'user-123');
      expect(mockNotificationRepo.markAsRead).toHaveBeenCalledWith('notif-123', 'user-123');
    });
  });
});
