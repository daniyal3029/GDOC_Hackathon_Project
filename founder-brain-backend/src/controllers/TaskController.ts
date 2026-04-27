import { Request, Response, NextFunction } from 'express';
import { ITaskService } from '../interfaces/ITaskService';
import { IIdempotencyService } from '../interfaces/IIdempotencyService';
import { ILogger } from '../interfaces/ILogger';
import { ApiResponse } from '../dtos/base/ApiResponse.dto';
import { TaskFiltersRequestSchema } from '../dtos/task/TaskFilters.dto';
import { UpdateTaskRequestSchema } from '../dtos/task/UpdateTask.dto';
import { TaskResponseDto } from '../dtos/task/TaskResponse.dto';
import { createGroupedTasksResponse } from '../dtos/task/GroupedTasks.dto';

/**
 * Controller for task-related operations.
 */
export class TaskController {
  constructor(
    private taskService: ITaskService,
    private logger: ILogger,
    private idempotencyService?: IIdempotencyService
  ) {}

  /**
   * Retrieves all tasks with filtering and pagination.
   */
  getTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = TaskFiltersRequestSchema.parse({
        ...req.query,
        ...(req as any).pagination
      });
      
      const result = await this.taskService.getTasks(validated as any, validated as any);
      
      return res.status(200).json(ApiResponse.paginated(
        result.data,
        result.pagination as any
      ));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves pending tasks grouped by owner.
   */
  getPendingGrouped = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const grouped = await this.taskService.getPendingTasksGrouped();
      const responseDto = createGroupedTasksResponse(grouped);
      return res.status(200).json(ApiResponse.success(responseDto));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves a single task by ID.
   */
  getTaskById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const task = await this.taskService.getTaskById(id);
      
      return res.status(200).json(ApiResponse.success(task));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Completes a task with optimistic locking.
   */
  completeTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const ifMatch = req.headers['if-match'];
      const version = ifMatch ? parseInt(ifMatch as string, 10) : req.body.version;

      if (version === undefined || isNaN(version)) {
        return res.status(400).json(ApiResponse.error('Version (via If-Match header or body) is required for optimistic locking.'));
      }

      const key = (req as any).idempotencyKey;
      
      if (this.idempotencyService && key) {
        const result = await this.idempotencyService.process(key, req, async () => {
          return await this.taskService.completeTask(id, version);
        });

        if (result.status === 'processing') {
          res.setHeader('Retry-After', '5');
          return res.status(409).json(ApiResponse.error('Request already processing, please wait', 409));
        }

        if (result.status === 'completed') {
          const task = result.response as TaskResponseDto;
          if (result.fromCache) res.setHeader('Idempotency-Replayed', 'true');
          res.setHeader('ETag', task.version.toString());
          return res.status(200).json(ApiResponse.success(task, 'Task marked as completed.'));
        }

        if (result.status === 'failed') {
          throw result.error;
        }
      } else {
        const updatedTask = await this.taskService.completeTask(id, version);
        res.setHeader('ETag', updatedTask.version.toString());
        return res.status(200).json(ApiResponse.success(updatedTask, 'Task marked as completed.'));
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Updates task fields with optimistic locking.
   */
  updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const validated = UpdateTaskRequestSchema.parse(req.body);
      
      const ifMatch = req.headers['if-match'];
      const version = ifMatch ? parseInt(ifMatch as string, 10) : req.body.version;

      if (version === undefined || isNaN(version)) {
        return res.status(400).json(ApiResponse.error('Version (via If-Match header or body) is required for optimistic locking.'));
      }

      const key = (req as any).idempotencyKey;

      if (this.idempotencyService && key) {
        const result = await this.idempotencyService.process(key, req, async () => {
          return await this.taskService.updateTask(id, validated, version);
        });

        if (result.status === 'processing') {
          res.setHeader('Retry-After', '5');
          return res.status(409).json(ApiResponse.error('Request already processing, please wait', 409));
        }

        if (result.status === 'completed') {
          const task = result.response as TaskResponseDto;
          if (result.fromCache) res.setHeader('Idempotency-Replayed', 'true');
          res.setHeader('ETag', task.version.toString());
          return res.status(200).json(ApiResponse.success(task, 'Task updated successfully.'));
        }

        if (result.status === 'failed') {
          throw result.error;
        }
      } else {
        const updatedTask = await this.taskService.updateTask(id, validated, version);
        res.setHeader('ETag', updatedTask.version.toString());
        return res.status(200).json(ApiResponse.success(updatedTask, 'Task updated successfully.'));
      }
    } catch (error) {
      next(error);
    }
  };
}
