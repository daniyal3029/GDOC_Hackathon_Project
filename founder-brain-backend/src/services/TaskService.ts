import { ITaskService } from '../interfaces/ITaskService';
import { ITaskRepository } from '../interfaces/ITaskRepository';
import { INotificationRepository } from '../interfaces/INotificationRepository';
import { ILogger } from '../interfaces/ILogger';
import { ISocketServer } from '../interfaces/ISocketServer';
import { TaskResponseDto } from '../dtos/task/TaskResponse.dto';
import { PaginatedResponseDto } from '../dtos/base/Pagination.dto';
import { SocketEvents } from '../socket/SocketEvents';
import AppError from '../utils/AppError';
import { CacheInvalidationService } from './CacheInvalidationService';
import { runTransaction } from '../utils/transactionRunner';
import { tasksCompletedTotal } from '../monitoring/metrics/MetricsService';

/**
 * Implementation of ITaskService.
 */
export class TaskService implements ITaskService {
  constructor(
    private taskRepository: ITaskRepository,
    private notificationRepository: INotificationRepository,
    private socketServer: ISocketServer,
    private cacheInvalidationService: CacheInvalidationService,
    private logger: ILogger
  ) {}

  async getTasks(filters: any, pagination: any): Promise<PaginatedResponseDto<TaskResponseDto>> {
    const { tasks, total } = await this.taskRepository.findAll({ ...filters, ...pagination });
    
    return {
      data: TaskResponseDto.fromDocuments(tasks),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNext: pagination.page < Math.ceil(total / pagination.limit),
        hasPrev: pagination.page > 1
      },
    };
  }

  async getPendingTasksGrouped(): Promise<Record<string, TaskResponseDto[]>> {
    const groupedData = await this.taskRepository.findPendingGroupedByOwner();
    const result: Record<string, TaskResponseDto[]> = {};

    for (const owner in groupedData) {
      result[owner] = TaskResponseDto.fromDocuments(groupedData[owner]);
    }

    return result;
  }

  async getTaskById(taskId: string): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }
    return TaskResponseDto.fromDocument(task);
  }

  async completeTask(taskId: string, version: number): Promise<TaskResponseDto> {
    const result = await runTransaction(async (session) => {
      // 1. Update task with optimistic lock
      const updates = {
        status: 'completed' as const,
        completedAt: new Date(),
      };

      const updatedTask = await this.taskRepository.updateWithOptimisticLock(taskId, updates, version, { session });
      
      if (!updatedTask) {
        throw new AppError('Conflict: Task was modified by another request. Please refresh and retry.', 409);
      }

      // 2. Create notification atomically
      if (updatedTask.owner) {
        await this.notificationRepository.create({
          userId: updatedTask.owner,
          type: 'task_completed',
          title: 'Task Completed',
          message: `Task "${updatedTask.description}" has been marked as completed.`,
          metadata: { taskId: updatedTask._id, meetingId: updatedTask.meetingId }
        }, { session });
      }

      return updatedTask;
    });

    // 3. Invalidate caches (outside transaction)
    await this.cacheInvalidationService.invalidate('task', 'UPDATE', taskId);
    if (result.meetingId) {
      await this.cacheInvalidationService.invalidate('meeting', 'UPDATE', result.meetingId.toString());
    }

    const response = TaskResponseDto.fromDocument(result);
    
    // Emit broadcasts
    this.socketServer.emitToRoom('tasks:all', SocketEvents.TASK_COMPLETED, response);
    if (result.owner) {
      this.socketServer.emitToRoom(`tasks:owner:${result.owner}`, SocketEvents.TASK_COMPLETED, response);
      // Record metric
      tasksCompletedTotal.inc({ owner: result.owner });
    }
    if (result.meetingId) {
      this.socketServer.emitToRoom(`meeting:${result.meetingId}`, SocketEvents.TASK_COMPLETED, response);
    }

    this.logger.info('Task marked as completed with atomic notification', { taskId, version: result.version });
    return response;
  }

  async updateTask(taskId: string, updates: any, version: number): Promise<TaskResponseDto> {
    // If status is being updated to pending, clear completedAt
    if (updates.status === 'pending') {
      updates.completedAt = null;
    } else if (updates.status === 'completed') {
      updates.completedAt = new Date();
    }

    const previousTask = await this.taskRepository.findById(taskId);
    
    const result = await runTransaction(async (session) => {
      const updatedTask = await this.taskRepository.updateWithOptimisticLock(taskId, updates, version, { session });

      if (!updatedTask) {
        throw new AppError('Conflict: Task was modified by another request. Please refresh and retry.', 409);
      }

      // If owner changed, notify both? Or just new owner?
      // For now, let's just keep it simple as per requirements.

      return updatedTask;
    });

    // Invalidate caches
    await this.cacheInvalidationService.invalidate('task', 'UPDATE', taskId);

    const response = TaskResponseDto.fromDocument(result);
    
    // Broadcast updates
    this.socketServer.emitToRoom('tasks:all', SocketEvents.TASK_UPDATED, response);
    if (previousTask?.owner) {
      this.socketServer.emitToRoom(`tasks:owner:${previousTask.owner}`, SocketEvents.TASK_UPDATED, response);
    }
    if (result.owner && result.owner !== previousTask?.owner) {
      this.socketServer.emitToRoom(`tasks:owner:${result.owner}`, SocketEvents.TASK_UPDATED, response);
    }

    this.logger.info('Task fields updated (transactional)', { taskId, updates });
    return response;
  }
}
