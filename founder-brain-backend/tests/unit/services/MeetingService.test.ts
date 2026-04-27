import { MeetingService } from '../../../src/services/MeetingService';
import { createTestMeeting } from '../../helpers/testFactory';
import mongoose from 'mongoose';

// Mock meeting queue
jest.mock('../../../src/queues/meetingQueue', () => ({
  addMeetingJob: jest.fn().mockResolvedValue({ id: 'job-123' }),
  getJobStatus: jest.fn(),
}));

describe('MeetingService Unit Tests', () => {
  let meetingService: MeetingService;
  let mockMeetingRepository: any;
  let mockSocketServer: any;
  let mockCacheInvalidationService: any;
  let mockLogger: any;

  beforeEach(() => {
    mockMeetingRepository = {
      create: jest.fn().mockImplementation((data) => ({ _id: new mongoose.Types.ObjectId(), ...data, save: jest.fn() })),
      findById: jest.fn(),
      findPaginated: jest.fn(),
    };
    mockSocketServer = {
      emitToRoom: jest.fn(),
    };
    mockCacheInvalidationService = {
      invalidate: jest.fn(),
    };
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    meetingService = new MeetingService(
      mockMeetingRepository,
      mockSocketServer,
      mockCacheInvalidationService,
      mockLogger
    );
  });

  describe('processMeetingAsync', () => {
    it('should create a meeting and queue a job', async () => {
      const text = 'Test meeting notes';
      const result = await meetingService.processMeetingAsync(text);

      expect(result.jobId).toBe('job-123');
      expect(result.meetingId).toBeDefined();
      expect(mockMeetingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ rawText: text, processingStatus: 'pending' }),
        expect.anything()
      );
    });
  });

  describe('getMeetingStatus', () => {
    it('should return completed status from document', async () => {
      const meeting = createTestMeeting({ processingStatus: 'completed' });
      mockMeetingRepository.findById.mockResolvedValue(meeting);

      const result = await meetingService.getMeetingStatus(meeting._id.toString());

      expect(result.status).toBe('completed');
      expect(result.progress).toBe(100);
    });
  });
});
