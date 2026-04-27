import api from './client';
import type { ApiResponse, PaginatedResponse } from '../../types/api.types';
import type { Task } from '../../types/meeting.types';

export const taskApi = {
  getTasks: async (params?: { status?: string; owner?: string; page?: number; limit?: number }) => {
    const { data } = await api.get<PaginatedResponse<Task>>('/tasks', { params });
    return data;
  },

  getTask: async (id: string) => {
    const { data } = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return data.data;
  },

  getPendingGrouped: async () => {
    const { data } = await api.get<ApiResponse<Record<string, Task[]>>>('/tasks/pending/grouped');
    return data.data;
  },

  completeTask: async (id: string, version: number) => {
    const { data } = await api.post<ApiResponse<Task>>(
      `/tasks/${id}/complete`,
      {},
      { headers: { 'If-Match': String(version) } }
    );
    return data.data;
  },

  updateTask: async (id: string, updates: Partial<Task>, version: number) => {
    const { data } = await api.patch<ApiResponse<Task>>(
      `/tasks/${id}`,
      { ...updates, version },
      { headers: { 'If-Match': String(version) } }
    );
    return data.data;
  },
};
