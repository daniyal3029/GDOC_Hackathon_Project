import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface for Task Document.
 */
export interface ITask {
  userId: mongoose.Types.ObjectId;
  description: string;
  owner?: string | null;
  deadline?: Date | null;
  status: 'pending' | 'completed';
  version: number;
  meetingId: mongoose.Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaskDocument extends ITask, Document {}

const taskSchema = new Schema<ITaskDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    owner: { type: String, default: null },
    deadline: { type: Date, default: null },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    version: { type: Number, default: 0 },
    meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for query performance
taskSchema.index({ meetingId: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ owner: 1 });
taskSchema.index({ userId: 1 });

export const Task = mongoose.model<ITaskDocument>('Task', taskSchema);
export default Task;
