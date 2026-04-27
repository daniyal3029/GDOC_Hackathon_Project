import config from './environment';

export const CacheTTLs = {
  // High volatility
  PENDING_TASKS: config.CACHE_TTL_PENDING_TASKS || 30,
  MEETING_STATUS: 5,
  
  // Medium volatility
  MEETING_LIST: config.CACHE_TTL_MEETING_LIST || 300,
  TASK_LIST: config.CACHE_TTL_TASK_LIST || 60,
  
  // Low volatility
  MEETING_DETAIL: config.CACHE_TTL_MEETING || 3600,
  DECISIONS: 86400, // 24 hours
  QUERY_RESULTS: config.CACHE_TTL_QUERY_RESULTS || 900,
  VECTOR_RESULTS: 600,
};

export const CachePrefixes = {
  MEETING: 'meeting:',
  MEETINGS_LIST: 'meetings:list:',
  TASK: 'task:',
  TASKS_LIST: 'tasks:list:',
  QUERY: 'query:',
  PENDING_GROUPED: 'pending:grouped:',
  USER_NOTIFICATIONS: 'notifications:user:',
};

export const getTTLForEndpoint = (endpoint: string): number => {
  if (endpoint.includes('/api/meetings/')) return CacheTTLs.MEETING_DETAIL;
  if (endpoint === '/api/meetings') return CacheTTLs.MEETING_LIST;
  if (endpoint === '/api/tasks/pending/grouped') return CacheTTLs.PENDING_TASKS;
  if (endpoint === '/api/tasks') return CacheTTLs.TASK_LIST;
  if (endpoint === '/api/query') return CacheTTLs.QUERY_RESULTS;
  return 60; // Default 1 minute
};
