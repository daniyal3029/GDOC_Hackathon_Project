export interface Meeting {
  _id: string;
  id?: string;
  rawText: string;
  summary: string;
  decisions: string[];
  tasks: Task[];
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
  lastEmbeddedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  id?: string;
  description: string;
  owner: string | null;
  deadline: string | null;
  status: 'pending' | 'completed';
  version: number;
  meetingId: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  jobId?: string;
  error?: string;
  step?: string;
}

export interface ProcessMeetingResponse {
  jobId: string;
  meetingId: string;
  status: string;
}

export interface MeetingStats {
  total: number;
  byStatus: Record<string, number>;
}
