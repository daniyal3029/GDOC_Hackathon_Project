import { ITaskDocument } from '../../models/Task';

/**
 * Response DTO for a Task.
 */
export class TaskResponseDto {
  id: string;
  description: string;
  owner: string | null;
  deadline: string | null;
  status: 'pending' | 'completed';
  version: number;
  meetingId: string;
  meetingTitle?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  daysUntilDeadline: number | null;
  isOverdue: boolean;

  constructor(doc: ITaskDocument, includeMeeting: boolean = false) {
    this.id = doc._id.toString();
    this.description = doc.description;
    this.owner = doc.owner ?? null;
    this.deadline = doc.deadline ? doc.deadline.toISOString() : null;
    this.status = doc.status;
    this.version = doc.version;
    this.meetingId = doc.meetingId.toString();
    this.completedAt = doc.completedAt ? doc.completedAt.toISOString() : undefined;
    this.createdAt = doc.createdAt.toISOString();
    this.updatedAt = doc.updatedAt.toISOString();
    
    // Computed fields
    this.daysUntilDeadline = doc.deadline 
      ? Math.ceil((doc.deadline.getTime() - Date.now()) / (1000 * 3600 * 24)) 
      : null;
    this.isOverdue = doc.deadline ? doc.deadline.getTime() < Date.now() && doc.status === 'pending' : false;

    if (includeMeeting && (doc as any).meetingId?.title) {
        this.meetingTitle = (doc as any).meetingId.title;
    }
  }

  static fromDocument(doc: ITaskDocument, includeMeeting: boolean = false): TaskResponseDto {
    return new TaskResponseDto(doc, includeMeeting);
  }

  static fromDocuments(docs: ITaskDocument[]): TaskResponseDto[] {
    return docs.map(doc => new TaskResponseDto(doc));
  }
}
