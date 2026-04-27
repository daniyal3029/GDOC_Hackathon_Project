import { TaskResponseDto } from './TaskResponse.dto';

/**
 * Response DTO for tasks grouped by owner.
 */
export interface GroupedTasksResponseDto {
  tasks: Record<string, TaskResponseDto[]>;
  metadata: {
    totalTasks: number;
    totalOwners: number;
    generatedAt: string;
  };
}

/**
 * Factory for GroupedTasksResponseDto.
 */
export const createGroupedTasksResponse = (tasksByOwner: Record<string, any[]>): GroupedTasksResponseDto => {
  const transformedTasks: Record<string, TaskResponseDto[]> = {};
  let totalTasks = 0;

  Object.entries(tasksByOwner).forEach(([owner, tasks]) => {
    const key = owner || 'unassigned';
    transformedTasks[key] = tasks.map(t => new TaskResponseDto(t));
    totalTasks += tasks.length;
  });

  return {
    tasks: transformedTasks,
    metadata: {
      totalTasks,
      totalOwners: Object.keys(transformedTasks).length,
      generatedAt: new Date().toISOString(),
    },
  };
};
