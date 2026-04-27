export type IdempotencyStatus = 'processing' | 'completed' | 'failed';

export interface StoredRequest {
  method: string;
  path: string;
  body: any;
  headers: Record<string, string>;
  timestamp: Date;
}

export interface StoredResponse {
  statusCode: number;
  body: any;
  headers: Record<string, string>;
  duration: number;
}

export interface IdempotencyConfig {
  ttlSeconds: number;
  maxPayloadSize: number;
}

export interface IdempotencyResult<T> {
  fromCache: boolean;
  status: IdempotencyStatus;
  response?: T;
  error?: any;
}
