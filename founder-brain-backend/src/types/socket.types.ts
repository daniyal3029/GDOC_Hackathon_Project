/**
 * Payload interfaces for socket events.
 */

export interface MeetingStatusPayload {
  meetingId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  step?: 'queued' | 'ai_analysis' | 'saving_tasks' | 'generating_embeddings' | 'complete';
  error?: string;
}

export interface TaskCreatedPayload {
  taskId: string;
  description: string;
  owner: string | null;
  meetingId: string;
  deadline: string | null;
}

export interface QueryChunkPayload {
  requestId: string;
  token: string;
  isComplete: boolean;
}

export interface PresencePayload {
  userId: string;
  roomId: string;
  action: 'join' | 'leave';
  timestamp: string;
}

export interface SocketData {
  userId: string;
  rooms: Set<string>;
}
