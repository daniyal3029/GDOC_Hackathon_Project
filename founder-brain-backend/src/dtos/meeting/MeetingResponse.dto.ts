import { IMeetingDocument } from '../../models/Meeting';

/**
 * Response DTO for a Meeting.
 */
export class MeetingResponseDto {
  id: string;
  rawText: string;
  summary: string;
  decisions: string[];
  tasks?: string[];
  processingStatus: string;
  embeddingStatus: string;
  jobId?: string;
  errorMessage?: string;
  processingDuration?: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;

  constructor(doc: IMeetingDocument) {
    this.id = doc._id.toString();
    this.rawText = doc.rawText;
    this.summary = doc.summary || '';
    this.decisions = doc.decisions || [];
    this.tasks = doc.tasks?.map(t => t.toString());
    this.processingStatus = doc.processingStatus;
    this.embeddingStatus = doc.embeddingStatus;
    this.jobId = doc.jobId;
    this.errorMessage = doc.errorMessage;
    this.processingDuration = doc.processingDuration;
    this.metadata = doc.metadata;
    this.createdAt = doc.createdAt.toISOString();
    this.updatedAt = doc.updatedAt.toISOString();
  }

  static fromDocument(doc: IMeetingDocument): MeetingResponseDto {
    return new MeetingResponseDto(doc);
  }

  static fromDocuments(docs: IMeetingDocument[]): MeetingResponseDto[] {
    return docs.map(doc => new MeetingResponseDto(doc));
  }
}
