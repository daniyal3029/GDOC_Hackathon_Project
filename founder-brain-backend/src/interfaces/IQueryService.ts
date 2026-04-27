import { QueryResponse } from '../types/api.types';

/**
 * Interface for Query Service.
 */
export interface IQueryService {
  /**
   * Asks a natural language question based on meeting context.
   */
  askQuestion(question: string, options?: any): Promise<QueryResponse>;

  /**
   * Streams an answer token by token (for WebSockets).
   */
  streamAnswer(question: string, onToken: (token: string) => void): Promise<void>;
}
