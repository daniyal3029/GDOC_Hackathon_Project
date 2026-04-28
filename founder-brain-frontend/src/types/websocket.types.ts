export interface WSMeetingStatus {
  meetingId: string;
  status: string;
  progress: number;
  step?: string;
}

export interface WSMeetingCompleted {
  meetingId: string;
  summary?: string;
  tasksCount?: number;
  decisionsCount?: number;
}

export interface WSMeetingFailed {
  meetingId: string;
  error: string;
}

export interface WSTaskCreated {
  taskId: string;
  description: string;
  owner: string;
  meetingId: string;
  deadline?: string;
}

export interface WSQueryChunk {
  requestId: string;
  token: string;
  isComplete: boolean;
}

export interface WSQueryComplete {
  requestId: string;
  answer: string;
  sources: {
    id: number;
    meetingId: string;
    textSnippet: string;
  }[];
}

export interface WSQueryError {
  requestId: string;
  message: string;
}

export const SocketEvent = {
  CONNECT: 'connection',
  DISCONNECT: 'disconnect',
  MEETING_STATUS: 'meeting:status',
  MEETING_COMPLETED: 'meeting:completed',
  MEETING_FAILED: 'meeting:failed',
  TASK_CREATED: 'task:created',
  TASK_COMPLETED: 'task:completed',
  TASK_UPDATED: 'task:updated',
  QUERY_ASK: 'query:ask',
  QUERY_CHUNK: 'query:chunk',
  QUERY_COMPLETE: 'query:complete',
  QUERY_ERROR: 'query:error',
  JOIN_ROOM: 'join:room',
  LEAVE_ROOM: 'leave:room',
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_COUNT: 'notification:count',
} as const;

export type SocketEvent = typeof SocketEvent[keyof typeof SocketEvent];
