import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface for Meeting Document.
 */
export interface IMeeting {
  userId: mongoose.Types.ObjectId;
  rawText: string;
  summary: string;
  decisions: string[];
  tasks: mongoose.Types.ObjectId[];
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  errorMessage?: string;
  processingDuration?: number;
  metadata?: {
    wordCount: number;
    hasDeadlines: boolean;
    mentionedPeople: string[];
  };
  embeddingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  embeddingChunksCount: number;
  lastEmbeddedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMeetingDocument extends IMeeting, Document {}

const meetingSchema = new Schema<IMeetingDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rawText: { type: String, required: true },
    summary: { type: String, default: '' },
    decisions: { type: [String], default: [] },
    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    jobId: { type: String },
    errorMessage: { type: String },
    processingDuration: { type: Number },
    metadata: {
      wordCount: { type: Number },
      hasDeadlines: { type: Boolean },
      mentionedPeople: { type: [String] },
    },
    embeddingStatus: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed'], 
      default: 'pending' 
    },
    embeddingChunksCount: { type: Number, default: 0 },
    lastEmbeddedAt: { type: Date },
  },
  { timestamps: true }
);

// Index for query performance
meetingSchema.index({ processingStatus: 1 });
meetingSchema.index({ userId: 1 });

export const Meeting = mongoose.model<IMeetingDocument>('Meeting', meetingSchema);
export default Meeting;
