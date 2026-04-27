import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  MEETING_PROCESSED = 'meeting_processed',
  DEADLINE_REMINDER = 'deadline_reminder',
}

export interface INotification {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: {
    taskId?: mongoose.Types.ObjectId;
    meetingId?: mongoose.Types.ObjectId;
    assignedBy?: string;
    deadline?: Date;
  };
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  expiresAt: Date;
}

export interface INotificationDocument extends INotification, Document {}

const NotificationSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    type: { 
      type: String, 
      enum: Object.values(NotificationType), 
      required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    metadata: {
      taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
      meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting' },
      assignedBy: { type: String },
      deadline: { type: Date },
    },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    expiresAt: { 
      type: Date, 
      required: true, 
      index: { expires: 0 } // TTL index
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user notifications list
NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotificationDocument>('Notification', NotificationSchema);
