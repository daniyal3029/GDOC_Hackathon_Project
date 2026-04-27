import api from './client';
import type { ApiResponse, QueryResponse } from '../../types/api.types';

export const queryApi = {
  askQuestion: async (question: string, maxSources = 5) => {
    const { data } = await api.post<ApiResponse<QueryResponse>>('/query', { question, maxSources });
    return data.data;
  },

  getSuggestions: async () => {
    const { data } = await api.get<ApiResponse<{ suggestions: string[] }>>('/query/suggestions');
    return data.data.suggestions;
  },
};
