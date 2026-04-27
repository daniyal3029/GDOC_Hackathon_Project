import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyMetric extends Document {
  date: Date;
  metrics: {
    totalRequests: number;
    errorRate: number;
    p95ResponseTimeMs: number;
    openaiTokens: number;
    openaiCost: number;
    meetingsProcessed: number;
    tasksCompleted: number;
  };
  details: Record<string, any>;
  createdAt: Date;
}

const DailyMetricSchema = new Schema<IDailyMetric>({
  date: { type: Date, required: true, index: true },
  metrics: {
    totalRequests: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 },
    p95ResponseTimeMs: { type: Number, default: 0 },
    openaiTokens: { type: Number, default: 0 },
    openaiCost: { type: Number, default: 0 },
    meetingsProcessed: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
  },
  details: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now, expires: '90d' } // Auto-delete after 90 days
});

// Compound index for date
DailyMetricSchema.index({ date: 1 }, { unique: true });

export const DailyMetric = mongoose.model<IDailyMetric>('DailyMetric', DailyMetricSchema);
