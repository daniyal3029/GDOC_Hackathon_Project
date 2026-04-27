import { TaskResponseDto } from '../dtos/task/TaskResponse.dto';
import { PaginatedResponseDto } from '../dtos/base/Pagination.dto';

/**
 * Interface for Task Service.
 */
export interface ITaskService {
  getTasks(filters: any, pagination: any): Promise<PaginatedResponseDto<TaskResponseDto>>;
  getPendingTasksGrouped(): Promise<Record<string, TaskResponseDto[]>>;
  completeTask(taskId: string, version: number): Promise<TaskResponseDto>;
  updateTask(taskId: string, updates: any, version: number): Promise<TaskResponseDto>;
  getTaskById(taskId: string): Promise<TaskResponseDto>;
}
