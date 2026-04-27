import { TaskService } from '../../../src/services/TaskService';
import { createTestTask } from '../../helpers/testFactory';
import mongoose from 'mongoose';

describe('TaskService Unit Tests', () => {
  let taskService: TaskService;
  let mockTaskRepository: any;
  let mockNotificationRepository: any;
  let mockSocketServer: any;
  let mockCacheInvalidationService: any;
  let mockLogger: any;

  beforeEach(() => {
    mockTaskRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      updateWithOptimisticLock: jest.fn(),
      findPendingGroupedByOwner: jest.fn(),
    };
    mockNotificationRepository = {
      create: jest.fn(),
    };
    mockSocketServer = {
      emitToRoom: jest.fn(),
    };
    mockCacheInvalidationService = {
      invalidate: jest.fn(),
    };
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    taskService = new TaskService(
      mockTaskRepository,
      mockNotificationRepository,
      mockSocketServer,
      mockCacheInvalidationService,
      mockLogger
    );
  });

  describe('completeTask', () => {
    it('should complete a task and create a notification', async () => {
      const task = createTestTask({ _id: new mongoose.Types.ObjectId() });
      mockTaskRepository.updateWithOptimisticLock.mockResolvedValue({
        ...task,
        status: 'completed',
        version: 1,
      });

      const result = await taskService.completeTask(task._id.toString(), 0);

      expect(result.status).toBe('completed');
      expect(result.version).toBe(1);
      expect(mockNotificationRepository.create).toHaveBeenCalled();
      expect(mockSocketServer.emitToRoom).toHaveBeenCalled();
      expect(mockCacheInvalidationService.invalidate).toHaveBeenCalledWith('task', 'UPDATE', expect.any(String));
    });

    it('should throw 409 error on version mismatch', async () => {
      mockTaskRepository.updateWithOptimisticLock.mockResolvedValue(null);

      await expect(taskService.completeTask('some-id', 0))
        .rejects.toThrow('Conflict');
    });
  });

  describe('getTasks', () => {
    it('should return paginated tasks', async () => {
      const tasks = [createTestTask(), createTestTask()];
      mockTaskRepository.findAll.mockResolvedValue({ tasks, total: 2 });

      const result = await taskService.getTasks({}, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });
  });
});
