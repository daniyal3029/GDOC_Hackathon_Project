import mongoose, { Schema, Document } from 'mongoose';
import { IdempotencyStatus } from '../types/idempotency.types';

export interface IIdempotencyRecord {
  _id: string; // Idempotency key
  key: string;
  status: IdempotencyStatus;
  request: {
    method: string;
    path: string;
    body: any;
    headers: Record<string, string>;
  };
  response?: {
    statusCode: number;
    body: any;
    headers: Record<string, string>;
  };
  error?: any;
  createdAt: Date;
  expiresAt: Date;
  processingDuration?: number;
  retryCount: number;
}

export type IIdempotencyRecordDocument = IIdempotencyRecord & Document<string>;

const IdempotencyRecordSchema = new Schema<IIdempotencyRecord>({
  _id: { type: String, required: true },
  key: { type: String, required: true, index: true },
  status: { 
    type: String, 
    enum: ['processing', 'completed', 'failed'], 
    required: true,
    index: true
  },
  request: {
    method: { type: String, required: true },
    path: { type: String, required: true },
    body: { type: Schema.Types.Mixed },
    headers: { type: Schema.Types.Map, of: String }
  },
  response: {
    statusCode: Number,
    body: { type: Schema.Types.Mixed },
    headers: { type: Schema.Types.Map, of: String }
  },
  error: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, required: true, index: true },
  processingDuration: Number,
  retryCount: { type: Number, default: 0 }
}, {
  timestamps: true,
  _id: false // We use the idempotency key as _id
});

// TTL Index for automatic deletion
IdempotencyRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IdempotencyRecord = mongoose.model<IIdempotencyRecord>('IdempotencyRecord', IdempotencyRecordSchema);
