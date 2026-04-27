import { IMeetingService } from '../interfaces/IMeetingService';
import { IMeetingRepository } from '../interfaces/IMeetingRepository';
import { IMeetingDocument } from '../models/Meeting';
import { ILogger } from '../interfaces/ILogger';
import { ISocketServer } from '../interfaces/ISocketServer';
import { PaginatedResponseDto } from '../dtos/base/Pagination.dto';
import { transformMeeting } from '../utils/responseTransformer';
import { addMeetingJob, getJobStatus } from '../queues/meetingQueue';
import AppError from '../utils/AppError';
import { CacheInvalidationService } from './CacheInvalidationService';
import { runTransaction } from '../utils/transactionRunner';
import { meetingsProcessedTotal } from '../monitoring/metrics/MetricsService';

/**
 * Implementation of IMeetingService.
 */
export class MeetingService implements IMeetingService {
  constructor(
    private meetingRepository: IMeetingRepository,
    private socketServer: ISocketServer,
    private cacheInvalidationService: CacheInvalidationService,
    private logger: ILogger
  ) {}

  async processMeetingAsync(userId: string, text: string): Promise<{ jobId: string; meetingId: string }> {
    const result = await runTransaction(async (session) => {
      const meeting = await this.meetingRepository.create({
        userId: userId as any,
        rawText: text,
        processingStatus: 'pending',
      }, { session });

      const meetingId = (meeting._id as any).toString();

      try {
        const job = await addMeetingJob(meetingId, userId, text);
        meeting.jobId = job.id;
        await meeting.save({ session });
        meetingsProcessedTotal.inc({ status: 'pending' });
        return { jobId: job.id as string, meetingId };
      } catch (error) {
        meetingsProcessedTotal.inc({ status: 'failed' });
        this.logger.error('Failed to queue meeting job', { error, meetingId });
        throw new AppError('Failed to process meeting. Please try again.', 500);
      }
    });

    await this.cacheInvalidationService.invalidate('meeting', 'CREATE');
    return result;
  }

  async getMeetingStatus(meetingId: string): Promise<any> {
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    let progress = 0;
    if (meeting.processingStatus === 'completed') {
      progress = 100;
    } else if (meeting.processingStatus === 'failed') {
      progress = 0;
    } else if (meeting.jobId) {
      const job = await getJobStatus(meeting.jobId);
      progress = job?.progress as number || 0;
    }

    return {
      status: meeting.processingStatus,
      progress,
      jobId: meeting.jobId,
      error: meeting.errorMessage,
    };
  }

  async getMeetingWithTasks(meetingId: string): Promise<any> {
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }
    return meeting;
  }

  async getMeetings(filters: any, pagination: any): Promise<PaginatedResponseDto<IMeetingDocument>> {
    const { meetings, total } = await this.meetingRepository.findPaginated(filters, pagination);
    
    return {
      data: meetings,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNext: pagination.page < Math.ceil(total / pagination.limit),
        hasPrev: pagination.page > 1
      },
    };
  }

  async getMeetingStatistics(userId: string): Promise<any> {
    return await this.meetingRepository.getStatistics(userId);
  }

  async getMeetingWithTaskProgress(meetingId: string): Promise<any> {
    const meeting = await this.getMeetingWithTasks(meetingId);
    const progress = await this.meetingRepository.getTaskCompletionRate(meetingId);
    
    return {
      ...transformMeeting(meeting),
      taskProgress: progress,
    };
  }
}
