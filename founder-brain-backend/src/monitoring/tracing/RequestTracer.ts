import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';

interface RequestContextData {
  traceId: string;
  userId?: string;
  method?: string;
  path?: string;
  startTime: number;
}

/**
 * AsyncLocalStorage-based request context for trace ID propagation
 * across async boundaries without manually passing IDs.
 */
class RequestContextManager {
  private storage = new AsyncLocalStorage<RequestContextData>();

  /**
   * Runs a callback within a new request context.
   */
  run<T>(data: Partial<RequestContextData>, fn: () => T): T {
    const context: RequestContextData = {
      traceId: data.traceId || uuidv4(),
      userId: data.userId,
      method: data.method,
      path: data.path,
      startTime: data.startTime || Date.now(),
    };
    return this.storage.run(context, fn);
  }

  /**
   * Gets the current trace ID from the active context.
   */
  getTraceId(): string {
    return this.storage.getStore()?.traceId || 'no-trace';
  }

  /**
   * Gets the current user ID from the active context.
   */
  getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }

  /**
   * Gets the full active context.
   */
  getContext(): RequestContextData | undefined {
    return this.storage.getStore();
  }
}

export const requestContext = new RequestContextManager();
