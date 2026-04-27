import { AIService } from '../../../src/services/AIService';
import { mockMeetingExtraction } from '../../mocks/openai.mock';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock GoogleGenerativeAI
jest.mock('@google/generative-ai');

describe('AIService Unit Tests', () => {
  let aiService: AIService;
  let mockLogger: any;
  let mockModel: any;

  beforeEach(() => {
    mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
    
    mockModel = {
      generateContent: jest.fn().mockResolvedValue({
        response: { text: () => JSON.stringify(mockMeetingExtraction) }
      })
    };

    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    }));

    aiService = new AIService(mockLogger);
  });

  describe('processMeetingNotes', () => {
    it('should use Gemini to extract data successfully', async () => {
      const result = await aiService.processMeetingNotes('Some notes');

      expect(result).toEqual(mockMeetingExtraction);
      expect(mockModel.generateContent).toHaveBeenCalled();
    });

    it('should retry if Gemini fails once then succeeds', async () => {
      mockModel.generateContent
        .mockRejectedValueOnce(new Error('Random Error'))
        .mockResolvedValueOnce({
          response: { text: () => JSON.stringify(mockMeetingExtraction) }
        });

      const result = await aiService.processMeetingNotes('Some notes');

      expect(result).toEqual(mockMeetingExtraction);
      expect(mockModel.generateContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('extractMentionedPeople', () => {
    it('should extract names correctly using regex', () => {
      const text = 'John Doe and Alice were there.';
      const result = aiService.extractMentionedPeople(text);

      expect(result).toContain('John');
      expect(result).toContain('Doe');
      expect(result).toContain('Alice');
    });
  });
});
