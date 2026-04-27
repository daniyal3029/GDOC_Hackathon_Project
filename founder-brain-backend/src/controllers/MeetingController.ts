import { Request, Response, NextFunction } from 'express';
import { IMeetingService } from '../interfaces/IMeetingService';
import { IIdempotencyService } from '../interfaces/IIdempotencyService';
import { ILogger } from '../interfaces/ILogger';
import { ApiResponse } from '../dtos/base/ApiResponse.dto';
import { CreateMeetingRequestSchema } from '../dtos/meeting/CreateMeeting.dto';
import { MeetingResponseDto } from '../dtos/meeting/MeetingResponse.dto';
import { MeetingStatusResponseDto } from '../dtos/meeting/MeetingStatus.dto';
import { MeetingFiltersRequestSchema } from '../dtos/meeting/MeetingFilters.dto';

/**
 * Controller for meeting-related requests.
 */
export class MeetingController {
  constructor(
    private meetingService: IMeetingService,
    private logger: ILogger,
    private idempotencyService?: IIdempotencyService
  ) {}

  /**
   * Start processing meeting notes.
   */
  processMeeting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = CreateMeetingRequestSchema.parse(req.body);
      
      this.logger.info('Processing meeting request received', { textLength: validated.text.length });

      const key = (req as any).idempotencyKey;
      
      if (this.idempotencyService && key) {
        const result = await this.idempotencyService.process(key, req, async () => {
          return await this.meetingService.processMeetingAsync(validated.text);
        });

        if (result.status === 'processing') {
          res.setHeader('Retry-After', '5');
          res.status(409).json(ApiResponse.error('Request already processing, please wait', 409));
          return;
        }

        if (result.status === 'completed') {
          if (result.fromCache) res.setHeader('Idempotency-Replayed', 'true');
          res.status(202).json(ApiResponse.success({
            ...result.response,
            status: 'queued'
          }, 'Meeting processing results.'));
          return;
        }

        if (result.status === 'failed') {
          throw result.error;
        }
      } else {
        const result = await this.meetingService.processMeetingAsync(validated.text);
        res.status(202).json(ApiResponse.success({
          ...result,
          status: 'queued'
        }, 'Meeting processing has been queued.'));
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get the status of a meeting processing.
   */
  getMeetingStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const statusData = await this.meetingService.getMeetingStatus(id);
      res.status(200).json(ApiResponse.success(new MeetingStatusResponseDto(statusData)));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get meeting details with tasks.
   */
  getMeeting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const meeting = await this.meetingRepository.findById(id);
      if (!meeting) {
        res.status(404).json(ApiResponse.error('Meeting not found', 404));
        return;
      }
      res.status(200).json(ApiResponse.success(MeetingResponseDto.fromDocument(meeting)));
    } catch (error) {
      next(error);
    }
  };

  // Necessary to access repository for getMeeting because service only returns document in one method
  private get meetingRepository() {
    return (this.meetingService as any).meetingRepository;
  }

  /**
   * List all meetings with pagination and search.
   */
  getMeetings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = MeetingFiltersRequestSchema.parse({
        ...req.query,
        ...(req as any).pagination
      });
      
      const result = await this.meetingService.getMeetings(validated, validated);
      
      return res.status(200).json(ApiResponse.paginated(
        MeetingResponseDto.fromDocuments(result.data), 
        result.pagination as any
      ));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get meeting statistics.
   */
  getMeetingStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.meetingService.getMeetingStatistics();
      return res.status(200).json(ApiResponse.success(stats));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get meeting details with task completion progress.
   */
  getMeetingWithProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.meetingService.getMeetingWithTaskProgress(id);
      
      return res.status(200).json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };
}
