import api from './client';
import type { ApiResponse, PaginatedResponse } from '../../types/api.types';
import type { Meeting, MeetingStatus, ProcessMeetingResponse, MeetingStats } from '../../types/meeting.types';

export const meetingApi = {
  processMeeting: async (text: string) => {
    const { data } = await api.post<ApiResponse<ProcessMeetingResponse>>('/meetings/process', { text });
    return data.data;
  },

  getMeeting: async (id: string) => {
    const { data } = await api.get<ApiResponse<Meeting>>(`/meetings/${id}`);
    return data.data;
  },

  getMeetings: async (page = 1, limit = 20, search?: string) => {
    const params: Record<string, any> = { page, limit };
    if (search) params.search = search;
    const { data } = await api.get<PaginatedResponse<Meeting>>('/meetings', { params });
    return data;
  },

  getMeetingStatus: async (id: string) => {
    const { data } = await api.get<ApiResponse<MeetingStatus>>(`/meetings/${id}/status`);
    return data.data;
  },

  getMeetingStats: async () => {
    const { data } = await api.get<ApiResponse<MeetingStats>>('/meetings/stats');
    return data.data;
  },

  getMeetingWithProgress: async (id: string) => {
    const { data } = await api.get<ApiResponse<any>>(`/meetings/${id}/progress`);
    return data.data;
  },
};
