/**
 * Constants for Socket.io events to avoid typos and ensure consistency.
 */
export const SocketEvents = {
  // Client -> Server
  MEETING_PROCESS: 'meeting:process',
  MEETING_SUBSCRIBE: 'meeting:subscribe',
  MEETING_UNSUBSCRIBE: 'meeting:unsubscribe',
  TASK_COMPLETE: 'task:complete',
  TASK_SUBSCRIBE: 'task:subscribe',
  QUERY_ASK: 'query:ask',
  QUERY_CANCEL: 'query:cancel',
  PRESENCE_JOIN: 'presence:join',
  PRESENCE_LEAVE: 'presence:leave',
  PRESENCE_PING: 'presence:ping',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_READ_ALL: 'notification:readAll',

  // Server -> Client
  MEETING_STATUS: 'meeting:status',
  MEETING_COMPLETED: 'meeting:completed',
  MEETING_FAILED: 'meeting:failed',
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_COMPLETED: 'task:completed',
  QUERY_CHUNK: 'query:chunk',
  QUERY_COMPLETE: 'query:complete',
  QUERY_ERROR: 'query:error',
  PRESENCE_USERS: 'presence:users',
  PRESENCE_JOINED: 'presence:joined',
  PRESENCE_LEFT: 'presence:left',
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_COUNT: 'notification:count',
  
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error'
} as const;
