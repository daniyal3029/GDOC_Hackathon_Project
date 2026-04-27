import { ITaskDocument } from '../models/Task';
import { IMeetingDocument } from '../models/Meeting';
import { TaskResponse, MeetingResponse } from '../types/api.types';

/**
 * Transforms a Task Mongoose document into a TaskResponse object.
 * @param task - The task document.
 */
export const transformTask = (task: ITaskDocument): TaskResponse => {
  return {
    id: (task._id as any).toString(),
    description: task.description,
    owner: task.owner ?? null,
    deadline: task.deadline ? task.deadline.toISOString() : null,
    status: task.status,
    version: task.version,
    meetingId: task.meetingId.toString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
};

/**
 * Transforms a Meeting Mongoose document into a MeetingResponse object.
 * @param meeting - The meeting document.
 */
export const transformMeeting = (meeting: IMeetingDocument): MeetingResponse => {
  const transformed: MeetingResponse = {
    id: (meeting._id as any).toString(),
    rawText: meeting.rawText,
    summary: meeting.summary,
    decisions: meeting.decisions,
    processingStatus: meeting.processingStatus,
    embeddingStatus: meeting.embeddingStatus,
    jobId: meeting.jobId,
    errorMessage: meeting.errorMessage,
    processingDuration: meeting.processingDuration,
    metadata: meeting.metadata,
    createdAt: meeting.createdAt.toISOString(),
    updatedAt: meeting.updatedAt.toISOString(),
  };

  if (meeting.tasks && meeting.tasks.length > 0 && typeof meeting.tasks[0] !== 'string') {
    transformed.tasks = meeting.tasks.map((t: any) => transformTask(t));
  }

  return transformed;
};
